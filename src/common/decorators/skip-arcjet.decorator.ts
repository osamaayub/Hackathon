import { SetMetadata } from '@nestjs/common';

export const SKIP_ARCJET_KEY = 'skipArcjet';

/** Exempts a route from the global Arcjet checks. Only for harmless public routes such as health checks. */
export const SkipArcjet = () => SetMetadata(SKIP_ARCJET_KEY, true);
