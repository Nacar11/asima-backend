import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { User } from '@/users/domain/user';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { GetUserDto } from '@/users/dto/get-user.dto';
import { UserLookupDto } from './dto/user-lookup.dto';
import { ClsService } from 'nestjs-cls';
import { StatusEnum } from '@/users/users.enum';
import { UserDetailsService } from '@/user-details/user-details.service';
import { BaseSellerRepository } from '@/sellers/persistence/base-seller.repository';
import { BaseSellerMemberRepository } from '@/seller-members/persistence/base-seller-member.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: BaseUserRepository,
    private readonly clsService: ClsService,
    private readonly userDetailsService: UserDetailsService,
    private readonly sellerRepository: BaseSellerRepository,
    private readonly sellerMemberRepository: BaseSellerMemberRepository,
  ) {}

  async findOrCreateGuestUser(params: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  }): Promise<User> {
    const existing = await this.usersRepository.findByEmail(params.email);

    if (existing) {
      // Reuse any existing user record (guest or full account)
      // to keep the flow idempotent by email.
      return existing;
    }

    const guestUser = Object.assign(new User(), {
      user_id: Date.now().toString(),
      email: params.email,
      first_name: params.first_name,
      last_name: params.last_name,
      phone: params.phone,
      email_verified: false,
      phone_verified: false,
      system_admin: false,
      status: StatusEnum.ACTIVE,
      is_guest: true,
    });

    return this.usersRepository.create(guestUser);
  }

  async create(
    createUserDto: CreateUserDto,
    causer: User | null = null,
  ): Promise<User> {
    // Extract user_details fields
    const { address, gender, date_of_birth, ...userFields } = createUserDto;
    const phone = createUserDto.phone;

    const newUser = Object.assign(new User(), userFields, {
      status: createUserDto.status ?? StatusEnum.ACTIVE,
      phone: phone ?? null,
      email_verified: createUserDto.email_verified ?? false,
      phone_verified: createUserDto.phone_verified ?? false,
      must_change_password: createUserDto.must_change_password ?? false,
      default_address_id: createUserDto.default_address_id ?? null,
      preferred_currency_id: createUserDto.preferred_currency_id ?? null,
      created_by: causer,
      updated_by: causer,
    });

    const salt = await bcrypt.genSalt();
    newUser.salt = salt;
    newUser.password = await bcrypt.hash(createUserDto.password, salt);

    if (createUserDto.device_pin) {
      newUser.device_pin = await bcrypt.hash(createUserDto.device_pin, salt);
    }

    if (!createUserDto.user_id) {
      newUser.user_id = Date.now().toString();
    }

    newUser.system_admin =
      createUserDto.system_admin === undefined
        ? false
        : createUserDto.system_admin;

    if (createUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(
        createUserDto.email,
      );
      if (userObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailAlreadyExists',
          },
        });
      }
    }

    const createdUser = await this.usersRepository.create(newUser);

    // Create user_details if any detail field is provided
    if (
      phone !== undefined ||
      address !== undefined ||
      gender !== undefined ||
      date_of_birth !== undefined
    ) {
      await this.userDetailsService.upsertByUserId(
        createdUser.id,
        { phone, address, gender, date_of_birth },
        causer,
      );
    }

    // Refetch user to include details
    return (await this.usersRepository.findById(createdUser.id)) as User;
  }

  findManyBy(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.usersRepository.findManyBy(queryParamsParsed);
  }

  async findByConditions(conditions: Record<string, any>) {
    return this.usersRepository.findOneBy(conditions);
  }

  async findById(id: User['id']): Promise<NullableType<User>> {
    const user = await this.usersRepository.findById(id);

    if (!user) throw new NotFoundException('User does not exist!');

    return user;
  }

  findByIds(ids: User['id'][]): Promise<User[]> {
    return this.usersRepository.findByIds(ids);
  }

  async findByUserId(id: User['user_id']): Promise<NullableType<User>> {
    const user = await this.usersRepository.findByUserId(id);

    if (!user) throw new NotFoundException('Driver does not exist!');

    return user;
  }

  findByEmail(email: User['email']): Promise<NullableType<User>> {
    return this.usersRepository.findByEmail(email);
  }

  findByIdWithCredentials(id: User['id']): Promise<NullableType<User>> {
    return this.usersRepository.findByIdWithCredentials(id);
  }

  findByEmailWithCredentials(
    email: User['email'],
  ): Promise<NullableType<User>> {
    return this.usersRepository.findByEmailWithCredentials(email);
  }

  async findByIdOrThrow(id: User['id']) {
    const user = await this.usersRepository.findById(id);

    if (!user) throw new UnprocessableEntityException('User does not exist');

    return { id: user.id };
  }

  async findAll(): Promise<
    Pick<User, 'id' | 'first_name' | 'middle_name' | 'last_name'>[]
  > {
    return this.usersRepository.findAll();
  }

  async findEligibleSellerUsers(): Promise<
    Pick<User, 'id' | 'first_name' | 'middle_name' | 'last_name'>[]
  > {
    return this.usersRepository.findEligibleSellerUsers();
  }

  async update(
    id: User['id'],
    updateUserDto: UpdateUserDto,
    causer: User | null = null,
    avatarFile?: Express.Multer.File,
    profilePictureDto?: string | null,
  ): Promise<User | null> {
    // Get existing user
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User does not exist!');
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash(updateUserDto.password, salt);

      updateUserDto['salt'] = salt;
      updateUserDto['password'] = password;
    }

    // Extract user_details fields
    const { address, gender, date_of_birth, ...userFields } = updateUserDto;
    const phone = updateUserDto.phone;

    const partialUser: Partial<User> = new User();

    Object.assign(partialUser, userFields, {
      updated_by: causer,
    });

    await this.usersRepository.update(id, partialUser);

    // Update user_details if any detail field is provided
    if (
      phone !== undefined ||
      address !== undefined ||
      gender !== undefined ||
      date_of_birth !== undefined
    ) {
      await this.userDetailsService.upsertByUserId(
        Number(id),
        { phone, address, gender, date_of_birth },
        causer,
      );
    }

    // Handle profile picture update via user_details service
    await this.userDetailsService.updateProfilePicture(
      Number(id),
      avatarFile,
      profilePictureDto,
      causer,
    );

    // Refetch user to include updated details
    return this.usersRepository.findById(id);
  }

  async bulkHold(ids: User['id'][]) {
    const causer = this.clsService.get('currentUser');
    const users = await this.usersRepository.findByIds(ids);
    if (users.length === 0) {
      throw new NotFoundException('No users found for the provided IDs.');
    }

    const alreadyHold = users.filter((c) => c.status === StatusEnum.HOLD);

    if (alreadyHold.length > 0) {
      const controlNos = alreadyHold.map((c) => c.user_id).join(', ');
      throw new BadRequestException(
        `The following Users are already on HOLD: ${controlNos}`,
      );
    }

    const nonActive = users.filter((c) => c.status !== StatusEnum.ACTIVE);

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.user_id).join(', ');
      throw new BadRequestException(
        `The following Users are not in ACTIVE status and cannot be HOLD: ${controlNos}`,
      );
    }

    await this.usersRepository.bulkUpdate(ids, {
      status: StatusEnum.HOLD,
      updated_by: causer,
    });
  }

  async bulkRelease(ids: User['id'][]) {
    const causer = this.clsService.get('currentUser');
    const users = await this.usersRepository.findByIds(ids);

    if (users.length === 0) {
      throw new NotFoundException('No users found for the provided IDs.');
    }

    const alreadyReleased = users.filter((c) => c.status === StatusEnum.ACTIVE);

    if (alreadyReleased.length > 0) {
      const controlNos = alreadyReleased.map((c) => c.user_id).join(', ');
      throw new BadRequestException(
        `The following Users are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = users.filter((c) => c.status !== StatusEnum.HOLD);

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.user_id).join(', ');
      throw new BadRequestException(
        `The following Users are not in HOLD status and cannot be RELEASED: ${controlNos}`,
      );
    }

    await this.usersRepository.bulkUpdate(ids, {
      status: StatusEnum.ACTIVE,
      updated_by: causer,
    });
  }

  async bulkDelete(ids: User['id'][]) {
    const users = await this.usersRepository.findByIds(ids);
    const causer = this.clsService.get('currentUser');

    if (users.length === 0) {
      throw new NotFoundException('No users found for the provided IDs.');
    }

    const alreadyCancelled = users.filter(
      (c) => c.status === StatusEnum.CANCELLED,
    );

    if (alreadyCancelled.length > 0) {
      const controlNos = alreadyCancelled.map((c) => c.user_id).join(', ');
      throw new BadRequestException(
        `The following Users are already RELEASED: ${controlNos}`,
      );
    }

    const nonActive = users.filter((c) => c.status !== StatusEnum.ACTIVE);

    if (nonActive.length > 0) {
      const controlNos = nonActive.map((c) => c.user_id).join(', ');
      throw new BadRequestException(
        `The following Users are not in ACTIVE status and cannot be CANCELLED: ${controlNos}`,
      );
    }

    await this.usersRepository.bulkUpdate(ids, {
      status: StatusEnum.CANCELLED,
      updated_by: causer,
      // deleted_by: causer,
    });
  }

  async remove(id: User['id'], causer: null | User): Promise<void> {
    const user = await this.findById(id);

    if (!user) throw new NotFoundException('User does not exist!');

    await this.usersRepository.remove(id, causer);
  }

  async retrieveTestData(query: GetUserDto) {
    return await this.usersRepository.findManyBy(query as GetQueryParams);
  }

  async lookup(queryParams: UserLookupDto) {
    const queryParamsParsed = {
      ...queryParams,
      searchExpr: (queryParams.searchExpr || '').replace(/"/g, ''),
      searchOperation: (queryParams.searchOperation || '').replace(/"/g, ''),
      searchValue: (queryParams.searchValue || '').replace(/"/g, ''),
    };
    if (queryParamsParsed.searchExpr) {
      queryParamsParsed.filter = [
        queryParamsParsed.searchExpr,
        queryParamsParsed.searchOperation,
        queryParamsParsed.searchValue,
      ];
    }
    return await this.usersRepository.lookup(queryParamsParsed);
  }

  async lookupById(id: number) {
    const result = await this.findById(id);
    return {
      id: result?.id,
      user_id: result?.user_id,
      first_name: result?.first_name,
      last_name: result?.last_name,
      email: result?.email,
    };
  }

  private convertArrayToObject(arr) {
    return arr.reduce((acc, item) => {
      acc[item.selector] = item.sorting;
      return acc;
    }, {});
  }

  async getUserCostCenter(id: User['id']): Promise<NullableType<User>> {
    const user = await this.usersRepository.getUserCostCenter(id);

    if (!user) throw new NotFoundException('User cost center does not exist!');

    return user;
  }

  /**
   * Get seller status for a single user
   * Returns whether the user has a seller account and/or is a seller member
   */
  async getSellerStatus(
    userId: number,
  ): Promise<{ has_seller: boolean; has_seller_member: boolean }> {
    const [seller, sellerMember] = await Promise.all([
      this.sellerRepository.findByUserId(userId),
      this.sellerMemberRepository.findByUserId(userId),
    ]);

    return {
      has_seller: !!seller,
      has_seller_member: !!sellerMember,
    };
  }

  /**
   * Get seller status for multiple users (bulk)
   * Returns a map of user IDs to their seller status
   */
  async getBulkSellerStatus(
    userIds: number[],
  ): Promise<
    Record<number, { has_seller: boolean; has_seller_member: boolean }>
  > {
    const results: Record<
      number,
      { has_seller: boolean; has_seller_member: boolean }
    > = {};

    // Process in parallel for better performance
    await Promise.all(
      userIds.map(async (userId) => {
        const [seller, sellerMember] = await Promise.all([
          this.sellerRepository.findByUserId(userId),
          this.sellerMemberRepository.findByUserId(userId),
        ]);
        results[userId] = {
          has_seller: !!seller,
          has_seller_member: !!sellerMember,
        };
      }),
    );

    return results;
  }
}
