import assert from "node:assert/strict";
import test from "node:test";
import { configureAccessTokenProvider } from "../src/api/client.js";

test("configureAccessTokenProvider accepts function or null", () => {
  assert.doesNotThrow(() => configureAccessTokenProvider(() => "token"));
  assert.doesNotThrow(() => configureAccessTokenProvider(null));
  assert.throws(() => configureAccessTokenProvider("not-a-function"), TypeError);
});
