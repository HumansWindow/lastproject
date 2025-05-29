# Hardcoded Column Reference Report

Generated: 5/8/2025, 2:20:25 PM

Found 5 files with potentially problematic column references.

## Files with hardcoded column references

- users/users.service.ts (4 references)
- users/services/user-sessions.service.ts (1 references)
- users/services/user-devices.service.ts (13 references)
- auth/auth.service.ts (3 references)
- auth/services/auth.service.ts (1 references)

## Detailed findings

### File: users/users.service.ts

**Line 160:**

```typescript
async findByWalletAddress(walletAddress: string): Promise<User | null> {
```

Replace:
- walletAddress → wallet_address

**Line 263:**

```typescript
const user = await this.findByWalletAddress(walletAddress);
```

Replace:
- walletAddress → wallet_address

**Line 292:**

```typescript
const user = await this.findByWalletAddress(walletAddress);
```

Replace:
- walletAddress → wallet_address

**Line 337:**

```typescript
const user = await this.findByWalletAddress(walletAddress);
```

Replace:
- walletAddress → wallet_address

### File: users/services/user-sessions.service.ts

**Line 122:**

```typescript
async findByUserId(userId: string): Promise<UserSession[]> {
```

Replace:
- userId → user_id

### File: users/services/user-devices.service.ts

**Line 24:**

```typescript
const existingDevices = await this.findByDeviceId(data.deviceId);
```

Replace:
- deviceId → device_id

**Line 56:**

```typescript
async findByUserId(userId: string): Promise<UserDevice[]> {
```

Replace:
- userId → user_id

**Line 63:**

```typescript
async findByDeviceId(deviceId: string): Promise<UserDevice[]> {
```

Replace:
- deviceId → device_id

**Line 81:**

```typescript
async findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<UserDevice | null> {
```

Replace:
- userId → user_id
- deviceId → device_id

**Line 154:**

```typescript
devices = await this.findByDeviceId(deviceId);
```

Replace:
- deviceId → device_id

**Line 354:**

```typescript
const devices = await this.findByDeviceId(deviceId);
```

Replace:
- deviceId → device_id

**Line 387:**

```typescript
const existingDevices = await this.findByDeviceId(deviceId);
```

Replace:
- deviceId → device_id

**Line 460:**

```typescript
const devices = await this.findByUserId(userId);
```

Replace:
- userId → user_id

**Line 503:**

```typescript
const devices = await this.findByDeviceId(deviceId);
```

Replace:
- deviceId → device_id

**Line 545:**

```typescript
const devicesWithThisId = await this.findByDeviceId(deviceId);
```

Replace:
- deviceId → device_id

**Line 607:**

```typescript
const devices = await this.findByDeviceId(deviceId);
```

Replace:
- deviceId → device_id

**Line 650:**

```typescript
const devices = await this.findByDeviceId(deviceId);
```

Replace:
- deviceId → device_id

### File: auth/auth.service.ts

**Line 136:**

```typescript
const devices = await this.userDevicesService.findByDeviceId(deviceId);
```

Replace:
- deviceId → device_id

**Line 163:**

```typescript
existingDevice = await this.userDevicesService.findByUserIdAndDeviceId(user.id, deviceId);
```

Replace:
- deviceId → device_id

**Line 242:**

```typescript
const existingDevices = await this.userDevicesService.findByDeviceId(deviceId);
```

Replace:
- deviceId → device_id

### File: auth/services/auth.service.ts

**Line 144:**

```typescript
const existingUser = await this.usersService.findByWalletAddress(walletAddress);
```

Replace:
- walletAddress → wallet_address

## Summary of column replacements

| CamelCase Column | Snake_case Column |
|-----------------|------------------|
| walletAddress | wallet_address |
| deviceId | device_id |
| userId | user_id |

## Next Steps

1. Review each problematic reference to determine if it needs updating
2. For TypeORM QueryBuilder usage, change any direct column references to use entity property names
3. For raw SQL, update all column names to use snake_case format
4. Review find* repository methods to ensure they use entity property names, not direct column names
5. Run the tests after each batch of changes to catch any issues early
