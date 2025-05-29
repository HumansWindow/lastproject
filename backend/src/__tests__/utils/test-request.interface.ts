// This interface is used for testing purposes to simulate a RequestWithUser without all Express Request properties
import { User } from '../../users/entities/user.entity';

export interface TestRequestWithUser {
  user: Partial<User>;
}
