import { SetMetadata } from '@nestjs/common';

export const SKIP_SESSION_CHECK_KEY = 'skipSessionCheck';
export const SkipSessionCheck = () => SetMetadata(SKIP_SESSION_CHECK_KEY, true);