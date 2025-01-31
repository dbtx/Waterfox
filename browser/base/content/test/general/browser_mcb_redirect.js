/*
 * Description of the Tests for
 *  - Bug 418354 - Call Mixed content blocking on redirects
 *
 * Single redirect script tests
 * 1. Load a script over https inside an https page
 *    - the server responds with a 302 redirect to a >> HTTP << script
 *    - the doorhanger should appear!
 *
 * 2. Load a script over https inside an http page
 *    - the server responds with a 302 redirect to a >> HTTP << script
 *    - the doorhanger should not appear!
 *
 * Single redirect image tests
 * 3. Load an image over https inside an https page
 *    - the server responds with a 302 redirect to a >> HTTP << image
 *    - the image should not load
 *
 * 4. Load an image over https inside an http page
 *    - the server responds with a 302 redirect to a >> HTTP << image
 *    - the image should load and get cached
 *
 * Single redirect cached image tests
 * 5. Using offline mode to ensure we hit the cache, load a cached image over
 *    https inside an http page
 *    - the server would have responded with a 302 redirect to a >> HTTP <<
 *      image, but instead we try to use the cached image.
 *    - the image should load
 *
 * 6. Using offline mode to ensure we hit the cache, load a cached image over
 *    https inside an https page
 *    - the server would have responded with a 302 redirect to a >> HTTP <<
 *      image, but instead we try to use the cached image.
 *    - the image should not load
 *
 * Double redirect image test
 * 7. Load an image over https inside an http page
 *    - the server responds with a 302 redirect to a >> HTTP << server
 *    - the HTTP server responds with a 302 redirect to a >> HTTPS << image
 *    - the image should load and get cached
 *
 * Double redirect cached image tests
 * 8. Using offline mode to ensure we hit the cache, load a cached image over
 *    https inside an http page
 *    - the image would have gone through two redirects: HTTPS->HTTP->HTTPS,
 *      but instead we try to use the cached image.
 *    - the image should load
 *
 * 9. Using offline mode to ensure we hit the cache, load a cached image over
 *    https inside an https page
 *    - the image would have gone through two redirects: HTTPS->HTTP->HTTPS,
 *      but instead we try to use the cached image.
 *    - the image should not load
 */

const PREF_ACTIVE = "security.mixed_content.block_active_content";
const PREF_DISPLAY = "security.mixed_content.block_display_content";
const HTTPS_TEST_ROOT = "https://example.com/browser/browser/base/content/test/general/";
const HTTP_TEST_ROOT = "http://example.com/browser/browser/base/content/test/general/";

var origBlockActive;
var origBlockDisplay;
var gTestBrowser = null;

// ------------------------ Helper Functions ---------------------

registerCleanupFunction(function() {
  // Set preferences back to their original values
  Services.prefs.setBoolPref(PREF_ACTIVE, origBlockActive);
  Services.prefs.setBoolPref(PREF_DISPLAY, origBlockDisplay);

  // Make sure we are online again
  Services.io.offline = false;
});

function cleanUpAfterTests() {
  gBrowser.removeCurrentTab();
  window.focus();
  finish();
}

// ------------------------ Test 1 ------------------------------

function test1() {
  var url = HTTPS_TEST_ROOT + "test_mcb_redirect.html";
  BrowserTestUtils.loadURI(gTestBrowser, url);
  BrowserTestUtils.browserLoaded(gTestBrowser).then(checkUIForTest1);
}

function checkUIForTest1() {
  assertMixedContentBlockingState(gTestBrowser, {activeLoaded: false, activeBlocked: true, passiveLoaded: false});

  ContentTask.spawn(gTestBrowser, null, function* () {
    var expected = "script blocked";
    yield ContentTaskUtils.waitForCondition(
      () => content.document.getElementById("mctestdiv").innerHTML == expected,
      "OK: Expected result in innerHTML for Test1!");
  }).then(test2);
}

// ------------------------ Test 2 ------------------------------

function test2() {
  var url = HTTP_TEST_ROOT + "test_mcb_redirect.html";
  BrowserTestUtils.loadURI(gTestBrowser, url);
  BrowserTestUtils.browserLoaded(gTestBrowser).then(checkUIForTest2);
}

function checkUIForTest2() {
  assertMixedContentBlockingState(gTestBrowser, {activeLoaded: false, activeBlocked: false, passiveLoaded: false});

  ContentTask.spawn(gTestBrowser, null, function* () {
    var expected = "script executed";
    yield ContentTaskUtils.waitForCondition(
      () => content.document.getElementById("mctestdiv").innerHTML == expected,
      "OK: Expected result in innerHTML for Test2!");
  }).then(test3);
}

// ------------------------ Test 3 ------------------------------
// HTTPS page loading insecure image
function test3() {
  info("test3");
  var url = HTTPS_TEST_ROOT + "test_mcb_redirect_image.html";
  BrowserTestUtils.loadURI(gTestBrowser, url);
  BrowserTestUtils.browserLoaded(gTestBrowser).then(checkLoadEventForTest3);
}

function checkLoadEventForTest3() {
  ContentTask.spawn(gTestBrowser, null, function* () {
    var expected = "image blocked"
    yield ContentTaskUtils.waitForCondition(
      () => content.document.getElementById("mctestdiv").innerHTML == expected,
      "OK: Expected result in innerHTML for Test3!");
  }).then(test4);
}

// ------------------------ Test 4 ------------------------------
// HTTP page loading insecure image
function test4() {
  info("test4");
  var url = HTTP_TEST_ROOT + "test_mcb_redirect_image.html";
  BrowserTestUtils.loadURI(gTestBrowser, url);
  BrowserTestUtils.browserLoaded(gTestBrowser).then(checkLoadEventForTest4);
}

function checkLoadEventForTest4() {
  ContentTask.spawn(gTestBrowser, null, function* () {
    var expected = "image loaded"
    yield ContentTaskUtils.waitForCondition(
      () => content.document.getElementById("mctestdiv").innerHTML == expected,
      "OK: Expected result in innerHTML for Test4!");
  }).then(test5);
}

// ------------------------ Test 5 ------------------------------
// HTTP page laoding insecure cached image
// Assuming test 4 succeeded, the image has already been loaded once
// and hence should be cached per the sjs cache-control header
// Going into offline mode to ensure we are loading from the cache.
function test5() {
  // Go into offline mode
  info("test5");
  Services.io.offline = true;
  var url = HTTP_TEST_ROOT + "test_mcb_redirect_image.html";
  BrowserTestUtils.loadURI(gTestBrowser, url);
  BrowserTestUtils.browserLoaded(gTestBrowser).then(checkLoadEventForTest5);
}

function checkLoadEventForTest5() {
  ContentTask.spawn(gTestBrowser, null, function* () {
    var expected = "image loaded"
    yield ContentTaskUtils.waitForCondition(
      () => content.document.getElementById("mctestdiv").innerHTML == expected,
      "OK: Expected result in innerHTML for Test5!");
  }).then(() => {
    // Go back online
    Services.io.offline = false;
    test6();
  });
}

// ------------------------ Test 6 ------------------------------
// HTTPS page loading insecure cached image
// Assuming test 4 succeeded, the image has already been loaded once
// and hence should be cached per the sjs cache-control header
// Going into offline mode to ensure we are loading from the cache.
function test6() {
  // Go into offline mode
  info("test6");
  Services.io.offline = true;
  var url = HTTPS_TEST_ROOT + "test_mcb_redirect_image.html";
  BrowserTestUtils.loadURI(gTestBrowser, url);
  BrowserTestUtils.browserLoaded(gTestBrowser).then(checkLoadEventForTest6);
}

function checkLoadEventForTest6() {
  ContentTask.spawn(gTestBrowser, null, function* () {
    var expected = "image blocked"
    yield ContentTaskUtils.waitForCondition(
      () => content.document.getElementById("mctestdiv").innerHTML == expected,
      "OK: Expected result in innerHTML for Test6!");
  }).then(() => {
    // Go back online
    Services.io.offline = false;
    test7();
  });
}

// ------------------------ Test 7 ------------------------------
// HTTP page loading insecure image that went through a double redirect
function test7() {
  var url = HTTP_TEST_ROOT + "test_mcb_double_redirect_image.html";
  BrowserTestUtils.loadURI(gTestBrowser, url);
  BrowserTestUtils.browserLoaded(gTestBrowser).then(checkLoadEventForTest7);
}

function checkLoadEventForTest7() {
  ContentTask.spawn(gTestBrowser, null, function* () {
    var expected = "image loaded"
    yield ContentTaskUtils.waitForCondition(
      () => content.document.getElementById("mctestdiv").innerHTML == expected,
      "OK: Expected result in innerHTML for Test7!");
  }).then(test8);
}

// ------------------------ Test 8 ------------------------------
// HTTP page loading insecure cached image that went through a double redirect
// Assuming test 7 succeeded, the image has already been loaded once
// and hence should be cached per the sjs cache-control header
// Going into offline mode to ensure we are loading from the cache.
function test8() {
  // Go into offline mode
  Services.io.offline = true;
  var url = HTTP_TEST_ROOT + "test_mcb_double_redirect_image.html";
  BrowserTestUtils.loadURI(gTestBrowser, url);
  BrowserTestUtils.browserLoaded(gTestBrowser).then(checkLoadEventForTest8);
}

function checkLoadEventForTest8() {
  ContentTask.spawn(gTestBrowser, null, function* () {
    var expected = "image loaded"
    yield ContentTaskUtils.waitForCondition(
      () => content.document.getElementById("mctestdiv").innerHTML == expected,
      "OK: Expected result in innerHTML for Test8!");
  }).then(() => {
    // Go back online
    Services.io.offline = false;
    test9();
  });
}

// ------------------------ Test 9 ------------------------------
// HTTPS page loading insecure cached image that went through a double redirect
// Assuming test 7 succeeded, the image has already been loaded once
// and hence should be cached per the sjs cache-control header
// Going into offline mode to ensure we are loading from the cache.
function test9() {
  // Go into offline mode
  Services.io.offline = true;
  var url = HTTPS_TEST_ROOT + "test_mcb_double_redirect_image.html";
  BrowserTestUtils.loadURI(gTestBrowser, url);
  BrowserTestUtils.browserLoaded(gTestBrowser).then(checkLoadEventForTest9);
}

function checkLoadEventForTest9() {
  ContentTask.spawn(gTestBrowser, null, function* () {
    var expected = "image blocked"
    yield ContentTaskUtils.waitForCondition(
      () => content.document.getElementById("mctestdiv").innerHTML == expected,
      "OK: Expected result in innerHTML for Test9!");
  }).then(() => {
    // Go back online
    Services.io.offline = false;
    cleanUpAfterTests();
  });
}

// ------------------------ SETUP ------------------------------

function test() {
  // Performing async calls, e.g. 'onload', we have to wait till all of them finished
  waitForExplicitFinish();

  // Store original preferences so we can restore settings after testing
  origBlockActive = Services.prefs.getBoolPref(PREF_ACTIVE);
  origBlockDisplay = Services.prefs.getBoolPref(PREF_DISPLAY);
  Services.prefs.setBoolPref(PREF_ACTIVE, true);
  Services.prefs.setBoolPref(PREF_DISPLAY, true);

  var newTab = gBrowser.addTab();
  gBrowser.selectedTab = newTab;
  gTestBrowser = gBrowser.selectedBrowser;
  newTab.linkedBrowser.stop();

  executeSoon(test1);
}
