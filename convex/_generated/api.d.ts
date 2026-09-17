/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as couples from "../couples.js";
import type * as dailyQuestions from "../dailyQuestions.js";
import type * as helpers from "../helpers.js";
import type * as journals from "../journals.js";
import type * as meetings from "../meetings.js";
import type * as memories from "../memories.js";
import type * as messages from "../messages.js";
import type * as moods from "../moods.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  couples: typeof couples;
  dailyQuestions: typeof dailyQuestions;
  helpers: typeof helpers;
  journals: typeof journals;
  meetings: typeof meetings;
  memories: typeof memories;
  messages: typeof messages;
  moods: typeof moods;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
