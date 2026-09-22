/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    user: import('../services/auth/auth.service').UserSession | null;
  }
}
