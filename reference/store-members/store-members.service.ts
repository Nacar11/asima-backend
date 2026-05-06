import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import ms from 'ms';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { UserSellerAssignmentEntity } from '@/user-seller-assignments/persistence/entities/user-seller-assignment.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { CreateStoreMemberDto } from './dto/create-store-member.dto';
import { AssignStoreMemberDto } from './dto/assign-store-member.dto';
import { UpdateStoreMemberDto } from './dto/update-store-member.dto';
import { JwtPayloadType } from '@/auth/strategies/types/jwt-payload.type';
import { MailService } from '@/mail/mail.service';
import { PasswordResetTokenRepository } from '@/password-reset-tokens/persistence/repositories/password-reset-token.repository';
import { AllConfigType } from '@/config/config.type';
import { PermissionCacheService } from '@/permissions/permission-cache.service';

@Injectable()
export class StoreMembersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserGroupEntity)
    private userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(UserAssignmentEntity)
    private userAssignmentRepository: Repository<UserAssignmentEntity>,
    @InjectRepository(UserSellerAssignmentEntity)
    private userSellerAssignmentRepository: Repository<UserSellerAssignmentEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    private jwtService: JwtService,
    private configService: ConfigService<AllConfigType>,
    private mailService: MailService,
    private passwordResetTokenRepository: PasswordResetTokenRepository,
    private permissionCacheService: PermissionCacheService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async validateStoreAccess(
    currentUser: JwtPayloadType,
  ): Promise<{ seller: SellerEntity; isOwner: boolean }> {
    if (!currentUser.seller_id) {
      throw new ForbiddenException('No store found');
    }

    const seller = await this.sellerRepository.findOne({
      where: { id: currentUser.seller_id },
    });

    if (!seller) {
      throw new ForbiddenException('No store found');
    }

    const isOwner = seller.user_id === currentUser.id;

    return { seller, isOwner };
  }

  private async validateNotAlreadyStoreMember(
    userId: number,
  ): Promise<UserSellerAssignmentEntity | null> {
    // Check for active assignment
    const active = await this.userSellerAssignmentRepository.findOne({
      where: { user: { id: userId }, status: 'Active' as any },
    });

    if (active) {
      throw new BadRequestException('User is already a member of a store');
    }

    // Check for soft-deleted assignment (can be restored)
    const softDeleted = await this.userSellerAssignmentRepository.findOne({
      where: { user: { id: userId } },
      withDeleted: true,
    });

    return softDeleted?.deleted_at ? softDeleted : null;
  }

  private async validateNotAdminStaff(userId: number): Promise<void> {
    const assignments = await this.userAssignmentRepository.find({
      where: { user: { id: userId }, status: 'Active' },
      relations: ['group'],
    });

    const hasAdminGroup = assignments.some(
      (a) => a.group && a.group.seller_id === null,
    );

    if (hasAdminGroup) {
      throw new BadRequestException('User is already an admin staff member');
    }
  }

  private async validateGroupBelongsToStore(
    groupId: number,
    sellerId: number,
  ): Promise<void> {
    const group = await this.userGroupRepository.findOne({
      where: { id: groupId, seller_id: sellerId },
    });

    if (!group) {
      throw new BadRequestException('Group does not belong to your store');
    }
  }

  async findAll(currentUser: JwtPayloadType) {
    const { seller } = await this.validateStoreAccess(currentUser);

    return this.userSellerAssignmentRepository.find({
      where: { seller: { id: seller.id } },
      relations: ['user', 'user.assignments', 'user.assignments.group'],
    });
  }

  async findOne(id: number, currentUser: JwtPayloadType) {
    const { seller } = await this.validateStoreAccess(currentUser);

    const assignment = await this.userSellerAssignmentRepository.findOne({
      where: { id, seller: { id: seller.id } },
      relations: ['user', 'user.assignments', 'user.assignments.group'],
    });

    if (!assignment) {
      throw new NotFoundException('Store member not found');
    }

    return assignment;
  }

  async assignMember(dto: AssignStoreMemberDto, currentUser: JwtPayloadType) {
    const { seller, isOwner } = await this.validateStoreAccess(currentUser);

    if (!isOwner) {
      throw new ForbiddenException(
        'Only the store owner can manage store members',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: dto.user_id },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (seller.user_id === dto.user_id) {
      throw new BadRequestException('Store owner cannot be assigned as member');
    }

    const softDeletedAssignment = await this.validateNotAlreadyStoreMember(
      dto.user_id,
    );
    await this.validateNotAdminStaff(dto.user_id);

    if (dto.group_id) {
      await this.validateGroupBelongsToStore(dto.group_id, seller.id);
    }

    let assignment: UserSellerAssignmentEntity;

    if (softDeletedAssignment) {
      // Restore previously cancelled assignment
      softDeletedAssignment.seller = { id: seller.id } as any;
      softDeletedAssignment.deleted_at = null;
      softDeletedAssignment.deleted_by = null;
      softDeletedAssignment.status = 'Active' as any;
      softDeletedAssignment.updated_by = { id: currentUser.id } as any;
      assignment = await this.userSellerAssignmentRepository.save(
        softDeletedAssignment,
      );
    } else {
      assignment = this.userSellerAssignmentRepository.create({
        seller: { id: seller.id } as any,
        user: { id: dto.user_id } as any,
        created_by: { id: currentUser.id } as any,
        updated_by: { id: currentUser.id } as any,
      });
      await this.userSellerAssignmentRepository.save(assignment);
    }

    if (dto.group_id) {
      const groupAssignment = this.userAssignmentRepository.create({
        user: { id: dto.user_id } as any,
        group: { id: dto.group_id } as any,
        created_by: { id: currentUser.id } as any,
        updated_by: { id: currentUser.id } as any,
      });
      await this.userAssignmentRepository.save(groupAssignment);
      await this.permissionCacheService.invalidateUserPermissions(dto.user_id);
    }

    return assignment;
  }

  async createMember(dto: CreateStoreMemberDto, currentUser: JwtPayloadType) {
    const { seller, isOwner } = await this.validateStoreAccess(currentUser);

    if (!isOwner) {
      throw new ForbiddenException(
        'Only the store owner can manage store members',
      );
    }

    // Get inviter (store owner) details
    const inviter = await this.userRepository.findOne({
      where: { id: currentUser.id },
    });

    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (dto.group_id) {
      await this.validateGroupBelongsToStore(dto.group_id, seller.id);
    }

    let savedUser: UserEntity;
    let isNewUser = false;
    let storeAssignment: UserSellerAssignmentEntity;

    if (existingUser) {
      // Check if user has set up their password (has logged in before)
      const hasPassword = existingUser.password && existingUser.password !== '';

      if (hasPassword) {
        throw new BadRequestException(
          'This email belongs to an active user. Use "Assign Existing User" instead.',
        );
      }

      // User exists but hasn't set up account - check if already a store member
      const existingStoreAssignment =
        await this.userSellerAssignmentRepository.findOne({
          where: { user: { id: existingUser.id }, status: 'Active' as any },
        });

      if (existingStoreAssignment) {
        // Already a member of a store
        if (existingStoreAssignment.seller_id === seller.id) {
          // Same store - just resend invitation (don't modify user data)
          savedUser = existingUser;
          storeAssignment = existingStoreAssignment;
        } else {
          throw new BadRequestException(
            'User is already a member of another store',
          );
        }
      } else {
        // No active assignment — check for a soft-deleted one (previously removed store member)
        const softDeletedAssignment =
          await this.userSellerAssignmentRepository.findOne({
            where: { user_id: existingUser.id },
            withDeleted: true,
          });

        if (softDeletedAssignment?.deleted_at) {
          // Restore the assignment and re-point it to the requesting store owner
          await this.userSellerAssignmentRepository.restore(
            softDeletedAssignment.id,
          );
          await this.userSellerAssignmentRepository.update(
            softDeletedAssignment.id,
            {
              seller_id: seller.id,
              seller: { id: seller.id } as any,
              updated_by: { id: currentUser.id } as any,
              deleted_by: null,
            },
          );
          // Update the user's phone with the new input
          await this.userRepository.update(existingUser.id, {
            phone: dto.phone ?? null,
            updated_by: { id: currentUser.id } as any,
          });
          savedUser = (await this.userRepository.findOne({
            where: { id: existingUser.id },
          }))!;
          storeAssignment = (await this.userSellerAssignmentRepository.findOne({
            where: { id: softDeletedAssignment.id },
          }))!;
        } else {
          // Genuinely unassigned user — require "Assign Existing User" flow
          throw new BadRequestException(
            'This email is already registered. Use "Assign Existing User" to add them to your store.',
          );
        }
      }
    } else {
      // Create new user
      isNewUser = true;
      const user = this.userRepository.create({
        user_id: Date.now().toString(),
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        phone: dto.phone,
        password: '',
        salt: '',
        system_admin: false,
        status: 'Active' as any,
        created_by: { id: currentUser.id } as any,
        updated_by: { id: currentUser.id } as any,
      });

      savedUser = await this.userRepository.save(user);

      storeAssignment = this.userSellerAssignmentRepository.create({
        seller: { id: seller.id } as any,
        user: { id: savedUser.id } as any,
        created_by: { id: currentUser.id } as any,
        updated_by: { id: currentUser.id } as any,
      });

      await this.userSellerAssignmentRepository.save(storeAssignment);
    }

    // Handle group assignment for new users or existing re-invited members
    if (dto.group_id) {
      // Check if user already has a store group assignment
      const existingGroupAssignment =
        await this.userAssignmentRepository.findOne({
          where: {
            user: { id: savedUser.id },
            group: { seller_id: seller.id },
            status: 'Active',
          },
          relations: ['group'],
        });

      if (existingGroupAssignment) {
        // Update existing assignment to new group
        existingGroupAssignment.group = { id: dto.group_id } as any;
        existingGroupAssignment.updated_by = { id: currentUser.id } as any;
        await this.userAssignmentRepository.save(existingGroupAssignment);
      } else {
        // Create new assignment
        const groupAssignment = this.userAssignmentRepository.create({
          user: { id: savedUser.id } as any,
          group: { id: dto.group_id } as any,
          created_by: { id: currentUser.id } as any,
          updated_by: { id: currentUser.id } as any,
        });
        await this.userAssignmentRepository.save(groupAssignment);
      }
      await this.permissionCacheService.invalidateUserPermissions(savedUser.id);
    }

    // Send invitation email
    let emailSent = false;
    try {
      const inviterName = inviter
        ? `${inviter.first_name} ${inviter.last_name}`
        : 'Store Owner';
      const memberName = `${savedUser.first_name} ${savedUser.last_name}`;

      await this.sendInvitationEmail(
        savedUser.id,
        dto.email,
        memberName,
        inviterName,
        seller.store_name,
      );
      emailSent = true;
    } catch (error) {
      console.error('Failed to send invitation email:', error);
    }

    return {
      user: savedUser,
      store_assignment: storeAssignment,
      email_sent: emailSent,
      is_new_user: isNewUser,
    };
  }

  private async sendInvitationEmail(
    userId: number,
    email: string,
    memberName: string,
    inviterName: string,
    storeName: string,
  ): Promise<void> {
    const tokenExpiresIn = this.configService.getOrThrow('auth.forgotExpires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);
    const expiresAt = new Date(tokenExpires);

    // Generate JWT hash for email link
    const hash = await this.jwtService.signAsync(
      {
        forgotUserId: userId,
      },
      {
        secret: this.configService.getOrThrow('auth.forgotSecret', {
          infer: true,
        }),
        expiresIn: tokenExpiresIn,
      },
    );

    // Generate OTP for manual entry
    const otp = this.generateOtp();
    const token = crypto.randomBytes(32).toString('hex');

    // Delete any existing tokens for this user before creating new ones
    await this.passwordResetTokenRepository.deleteByUserId(userId);

    // Save OTP to database
    await this.passwordResetTokenRepository.create({
      user_id: userId,
      token,
      otp,
      expires_at: expiresAt,
    });

    // Send store member invitation email
    await this.mailService.storeMemberInvitation({
      to: email,
      data: {
        hash,
        otp,
        tokenExpires,
        memberName,
        inviterName,
        storeName,
      },
    });
  }

  async remove(id: number, currentUser: JwtPayloadType) {
    const { seller, isOwner } = await this.validateStoreAccess(currentUser);

    if (!isOwner) {
      throw new ForbiddenException(
        'Only the store owner can manage store members',
      );
    }

    const assignment = await this.userSellerAssignmentRepository.findOne({
      where: { id, seller: { id: seller.id } },
    });

    if (!assignment) {
      throw new BadRequestException('Store member not found');
    }

    await this.userAssignmentRepository
      .createQueryBuilder()
      .softDelete()
      .where('user_id = :userId', { userId: assignment.user_id })
      .andWhere(
        'group_id IN (SELECT id FROM user_groups WHERE seller_id = :sellerId)',
        { sellerId: seller.id },
      )
      .execute();

    await this.permissionCacheService.invalidateUserPermissions(
      assignment.user_id,
    );

    return this.userSellerAssignmentRepository.softRemove(assignment);
  }

  async update(
    id: number,
    dto: UpdateStoreMemberDto,
    currentUser: JwtPayloadType,
  ) {
    const { seller, isOwner } = await this.validateStoreAccess(currentUser);

    if (!isOwner) {
      throw new ForbiddenException(
        'Only the store owner can manage store members',
      );
    }

    const assignment = await this.userSellerAssignmentRepository.findOne({
      where: { id, seller: { id: seller.id } },
      relations: ['user'],
    });

    if (!assignment) {
      throw new NotFoundException('Store member not found');
    }

    await this.userRepository.update(assignment.user.id, {
      ...(dto.first_name !== undefined && { first_name: dto.first_name }),
      ...(dto.last_name !== undefined && { last_name: dto.last_name }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      updated_by: { id: currentUser.id } as any,
    });

    return this.userSellerAssignmentRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async updateMemberGroup(
    id: number,
    dto: { group_id?: number | null },
    currentUser: JwtPayloadType,
  ) {
    const { seller, isOwner } = await this.validateStoreAccess(currentUser);

    if (!isOwner) {
      throw new ForbiddenException(
        'Only the store owner can manage store members',
      );
    }

    const storeAssignment = await this.userSellerAssignmentRepository.findOne({
      where: { id, seller: { id: seller.id } },
      relations: ['user'],
    });

    if (!storeAssignment) {
      throw new BadRequestException('Store member not found');
    }

    if (dto.group_id) {
      await this.validateGroupBelongsToStore(dto.group_id, seller.id);
    }

    // Find existing store group assignment for this user
    const existingAssignments = await this.userAssignmentRepository.find({
      where: { user: { id: storeAssignment.user.id }, status: 'Active' },
      relations: ['group'],
    });

    // Filter to only store group assignments (not admin groups)
    const existingStoreAssignment = existingAssignments.find(
      (a) => a.group?.seller_id === seller.id,
    );

    if (dto.group_id === null) {
      // Remove group assignment
      if (existingStoreAssignment) {
        await this.userAssignmentRepository.softRemove(existingStoreAssignment);
      }
      await this.permissionCacheService.invalidateUserPermissions(
        storeAssignment.user.id,
      );
      return { message: 'Group assignment removed' };
    }

    let result: UserAssignmentEntity;
    if (existingStoreAssignment) {
      // Update existing assignment
      existingStoreAssignment.group = { id: dto.group_id } as any;
      existingStoreAssignment.updated_by = { id: currentUser.id } as any;
      result = await this.userAssignmentRepository.save(
        existingStoreAssignment,
      );
    } else {
      // Create new assignment
      const newAssignment = this.userAssignmentRepository.create({
        user: { id: storeAssignment.user.id } as any,
        group: { id: dto.group_id } as any,
        created_by: { id: currentUser.id } as any,
        updated_by: { id: currentUser.id } as any,
      });
      result = await this.userAssignmentRepository.save(newAssignment);
    }

    await this.permissionCacheService.invalidateUserPermissions(
      storeAssignment.user.id,
    );
    return result;
  }
}
