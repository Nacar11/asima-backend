import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as path from 'path';
import { UserDetail, GenderEnum } from '@/user-details/domain/user-detail';
import { UpdateUserDetailDto } from '@/user-details/dto/update-user-detail.dto';
import { BaseUserDetailRepository } from '@/user-details/persistence/base-user-detail.repository';
import { User } from '@/users/domain/user';
import { StorageService } from '@/storage/storage.service';

@Injectable()
export class UserDetailsService {
  constructor(
    private readonly userDetailRepository: BaseUserDetailRepository,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Create user detail for a user
   */
  async create(
    userId: number,
    data: {
      phone?: string | null;
      address?: string | null;
      gender?: GenderEnum;
      date_of_birth?: string | Date;
    },
  ): Promise<UserDetail> {
    const userDetail: Partial<UserDetail> = {
      user_id: userId,
      phone: data.phone ?? null,
      address: data.address ?? null,
      gender: data.gender ?? null,
      date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
      timezone: 'UTC',
      locale: 'en_US',
    };

    return await this.userDetailRepository.create(userDetail);
  }

  /**
   * Find user detail by user ID
   */
  async findByUserId(userId: number): Promise<UserDetail | null> {
    return await this.userDetailRepository.findByUserId(userId);
  }

  /**
   * Update or create user detail by user ID
   */
  async upsertByUserId(
    userId: number,
    data: {
      phone?: string | null;
      address?: string | null;
      gender?: GenderEnum;
      date_of_birth?: string | Date;
    },
    causer?: User | null,
  ): Promise<UserDetail> {
    const existingUserDetail =
      await this.userDetailRepository.findByUserId(userId);

    if (existingUserDetail) {
      const updateData: Partial<UserDetail> = {};

      if (data.phone !== undefined) {
        updateData.phone = data.phone;
      }
      if (data.address !== undefined) {
        updateData.address = data.address;
      }
      if (data.gender !== undefined) {
        updateData.gender = data.gender;
      }
      if (data.date_of_birth !== undefined) {
        updateData.date_of_birth = data.date_of_birth
          ? new Date(data.date_of_birth)
          : null;
      }

      if (causer) {
        updateData.updated_by = {
          id: causer.id,
          first_name: causer.first_name,
          last_name: causer.last_name,
        };
      }

      return await this.userDetailRepository.update(
        existingUserDetail.id,
        updateData as UserDetail,
      );
    }

    return await this.create(userId, data);
  }

  /**
   * Update user detail by ID
   */
  async update(
    id: number,
    input: UpdateUserDetailDto,
    causer: User,
  ): Promise<UserDetail> {
    // Check if user detail exists
    const existingUserDetail = await this.userDetailRepository.findById(id);
    if (!existingUserDetail) {
      throw new NotFoundException(`User detail with ID ${id} not found`);
    }

    // Authorization check: only the user can edit their own user details
    if (existingUserDetail.user_id !== causer.id) {
      throw new ForbiddenException('You can only edit your own user details');
    }

    // Username uniqueness check (if username is being updated)
    if (input.username && input.username !== existingUserDetail.username) {
      const existingUserDetailWithSameUsername =
        await this.userDetailRepository.findByUsername(input.username);

      if (existingUserDetailWithSameUsername) {
        throw new ConflictException(
          `Username '${input.username}' is already taken`,
        );
      }
    }

    const updateData: Partial<UserDetail> = new UserDetail();
    Object.assign(updateData, input);

    // Add audit information
    updateData.updated_by = {
      id: causer.id,
      first_name: causer.first_name,
      last_name: causer.last_name,
    };

    return await this.userDetailRepository.update(id, updateData as UserDetail);
  }

  /**
   * Update profile picture for a user.
   *
   * @param userId - The user ID
   * @param avatarFile - Optional file to upload
   * @param profilePictureDto - Optional value from DTO ('' or null to remove, or base64 string)
   * @param causer - The user making the change
   * @returns Updated user detail or null
   *
   * Scenarios:
   * 1. No avatarFile AND profilePictureDto is undefined → no change
   * 2. profilePictureDto = '' or null (no file) → remove profile picture
   * 3. avatarFile provided → upload new file, delete old if exists
   * 4. profilePictureDto is base64 string → upload from base64, delete old if exists
   */
  async updateProfilePicture(
    userId: number,
    avatarFile?: Express.Multer.File,
    profilePictureDto?: string | null,
    causer?: User | null,
  ): Promise<UserDetail | null> {
    const hasAvatarFile = !!avatarFile;
    const isBase64 = this.isBase64Image(profilePictureDto);

    // If file is provided, ignore profilePictureDto - file upload takes precedence
    const isRemovalRequest =
      !hasAvatarFile &&
      !isBase64 &&
      profilePictureDto !== undefined &&
      (profilePictureDto === '' || profilePictureDto === null);

    // Scenario 1: No change requested (no file, no base64, and no profile_picture in request)
    if (!hasAvatarFile && !isBase64 && profilePictureDto === undefined) {
      return null;
    }

    // Get or create user detail
    let userDetail = await this.userDetailRepository.findByUserId(userId);

    if (!userDetail) {
      // Create user detail if it doesn't exist
      userDetail = await this.create(userId, {});
    }

    const updateData: Partial<UserDetail> = {};

    // Scenario 2: Explicit removal (profile_picture = '' or null, no file, no base64)
    if (isRemovalRequest && !hasAvatarFile && !isBase64) {
      // Delete old file from storage if exists
      if (userDetail.profile_picture_path) {
        try {
          await this.storageService.delete(userDetail.profile_picture_path);
        } catch {
          // Log but don't fail - file might already be deleted
        }
      }
      updateData.profile_picture = null;
      updateData.profile_picture_path = null;
    }

    // Scenario 3: Upload new file (multipart/form-data)
    if (hasAvatarFile) {
      // Validate file is an image
      if (!avatarFile.mimetype.startsWith('image/')) {
        throw new BadRequestException('Avatar must be an image file');
      }

      // Build the storage key (stored in users/{userId}/ folder)
      const ext = path.extname(avatarFile.originalname) || '.jpg';
      const key = `users/${userId}/avatar-${Date.now()}${ext}`;

      // Delete old file if exists (optional cleanup on replace)
      if (userDetail.profile_picture_path) {
        try {
          await this.storageService.delete(userDetail.profile_picture_path);
        } catch {
          // Log but don't fail - file might already be deleted
        }
      }

      // Upload new file
      const { url, key: storedKey } = await this.storageService.put(
        avatarFile,
        key,
      );

      updateData.profile_picture = url;
      updateData.profile_picture_path = storedKey;
    }

    // Scenario 4: Upload from base64 string
    if (!hasAvatarFile && isBase64 && profilePictureDto) {
      const { buffer, mimeType, extension } =
        this.parseBase64Image(profilePictureDto);

      // Build the storage key
      const key = `users/${userId}/avatar-${Date.now()}${extension}`;

      // Delete old file if exists
      if (userDetail.profile_picture_path) {
        try {
          await this.storageService.delete(userDetail.profile_picture_path);
        } catch {
          // Log but don't fail - file might already be deleted
        }
      }

      // Upload buffer
      const { url, key: storedKey } = await this.storageService.putBuffer(
        buffer,
        key,
        mimeType,
      );

      updateData.profile_picture = url;
      updateData.profile_picture_path = storedKey;
    }

    // Add audit information
    if (causer) {
      updateData.updated_by = {
        id: causer.id,
        first_name: causer.first_name,
        last_name: causer.last_name,
      };
    }

    if (Object.keys(updateData).length > 0) {
      return await this.userDetailRepository.update(
        userDetail.id,
        updateData as UserDetail,
      );
    }

    return userDetail;
  }

  /**
   * Check if a string is a base64 encoded image.
   * Accepts both data URI format (data:image/xxx;base64,xxxxx) and raw base64 strings.
   */
  private isBase64Image(value?: string | null): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    // Check for data URI format: data:image/xxx;base64,xxxxx
    if (/^data:image\/[a-zA-Z+]+;base64,/.test(value)) {
      return true;
    }
    // Check for raw base64 string (at least 20 chars to avoid false positives)
    if (value.length >= 20 && /^[A-Za-z0-9+/]+=*$/.test(value)) {
      return true;
    }
    return false;
  }

  /**
   * Parse a base64 image string and return buffer with metadata.
   * Accepts both data URI format (data:image/xxx;base64,xxxxx) and raw base64 strings.
   */
  private parseBase64Image(base64String: string): {
    buffer: Buffer;
    mimeType: string;
    extension: string;
  } {
    // Map common image types to extensions
    const extensionMap: Record<string, string> = {
      jpeg: '.jpg',
      jpg: '.jpg',
      png: '.png',
      gif: '.gif',
      webp: '.webp',
      svg: '.svg',
      'svg+xml': '.svg',
    };

    let mimeType: string;
    let extension: string;
    let base64Data: string;

    // Try to extract mime type and base64 data from data URI
    const matches = base64String.match(
      /^data:(image\/([a-zA-Z+]+));base64,(.+)$/,
    );

    if (matches) {
      // Data URI format
      mimeType = matches[1]; // e.g., 'image/png'
      const imageType = matches[2]; // e.g., 'png'
      base64Data = matches[3];
      extension = extensionMap[imageType.toLowerCase()] || '.jpg';
    } else {
      // Raw base64 string - decode and detect image type from magic bytes
      base64Data = base64String;
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length === 0) {
        throw new BadRequestException('Invalid base64 image data');
      }

      // Detect image type from magic bytes
      const detected = this.detectImageType(buffer);
      mimeType = detected.mimeType;
      extension = detected.extension;
    }

    // Decode base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Basic validation - check buffer is not empty
    if (buffer.length === 0) {
      throw new BadRequestException('Invalid base64 image data');
    }

    return { buffer, mimeType, extension };
  }

  /**
   * Detect image type from buffer magic bytes
   */
  private detectImageType(buffer: Buffer): {
    mimeType: string;
    extension: string;
  } {
    // Check magic bytes for common image formats
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e) {
      return { mimeType: 'image/png', extension: '.png' };
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { mimeType: 'image/jpeg', extension: '.jpg' };
    }
    if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return { mimeType: 'image/gif', extension: '.gif' };
    }
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return { mimeType: 'image/webp', extension: '.webp' };
    }
    // Default to JPEG if unknown
    return { mimeType: 'image/jpeg', extension: '.jpg' };
  }
}
