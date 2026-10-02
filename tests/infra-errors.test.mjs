import { test } from "node:test";
import assert from "node:assert/strict";
import { describeInfraError } from "../src/lib/infra-errors.ts";

const grpc = (code, message) => Object.assign(new Error(message), { code, details: message });

test("an exhausted daily quota says so, and how it ends", () => {
  const msg = describeInfraError(grpc(8, "8 RESOURCE_EXHAUSTED: Quota exceeded."));
  assert.match(msg, /daily allowance/);
  assert.match(msg, /Blaze/);
});

test("a rejected database key points at the key in Vercel", () => {
  assert.match(
    describeInfraError(grpc(16, "16 UNAUTHENTICATED: Request had invalid authentication credentials.")),
    /FIREBASE_SERVICE_ACCOUNT_B64/,
  );
});

test("a database that doesn't answer asks for a retry", () => {
  assert.match(describeInfraError(grpc(14, "14 UNAVAILABLE: No connection established")), /try again/);
});

test("an outage wrapped by Auth.js (cause.err) is still recognised", () => {
  const wrapped = Object.assign(new Error("CallbackRouteError"), {
    cause: { err: grpc(8, "8 RESOURCE_EXHAUSTED: Quota exceeded.") },
  });
  assert.match(describeInfraError(wrapped), /daily allowance/);
});

test("ordinary errors are not mistaken for an outage", () => {
  assert.equal(describeInfraError(new Error("Invalid TOTP code")), null);
  assert.equal(describeInfraError(undefined), null);
  assert.equal(describeInfraError(Object.assign(new Error("boom"), { code: "ENOENT" })), null);
});
