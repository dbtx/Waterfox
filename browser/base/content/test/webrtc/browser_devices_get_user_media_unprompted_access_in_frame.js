/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

registerCleanupFunction(function() {
  gBrowser.removeCurrentTab();
});

const permissionError = "error: NotAllowedError: The request is not allowed " +
    "by the user agent or the platform in the current context.";

var gTests = [

{
  desc: "getUserMedia audio+camera in frame 1",
  run: function* checkAudioVideoWhileLiveTracksExist_frame() {
    let promise = promisePopupNotificationShown("webRTC-shareDevices");
    yield promiseRequestDevice(true, true, "frame1");
    yield promise;
    yield expectObserverCalled("getUserMedia:request");
    checkDeviceSelectors(true, true);

    let indicator = promiseIndicatorWindow();
    yield promiseMessage("ok", () => {
      PopupNotifications.panel.firstChild.button.click();
    });
    yield expectObserverCalled("getUserMedia:response:allow");
    yield expectObserverCalled("recording-device-events");
    Assert.deepEqual((yield getMediaCaptureState()), {audio: true, video: true},
                     "expected camera and microphone to be shared");

    yield indicator;
    yield checkSharingUI({video: true, audio: true});
    yield expectNoObserverCalled();

    info("gUM(audio+camera) in frame 2 should prompt");
    promise = promisePopupNotificationShown("webRTC-shareDevices");
    yield promiseRequestDevice(true, true, "frame2");
    yield promise;
    yield expectObserverCalled("getUserMedia:request");
    checkDeviceSelectors(true, true);

    yield promiseMessage(permissionError, () => {
      activateSecondaryAction(kActionDeny);
    });

    yield expectObserverCalled("getUserMedia:response:deny");
    yield expectObserverCalled("recording-window-ended");
    SitePermissions.remove(null, "screen", gBrowser.selectedBrowser);
    SitePermissions.remove(null, "camera", gBrowser.selectedBrowser);
    SitePermissions.remove(null, "microphone", gBrowser.selectedBrowser);

    // If there's an active audio+camera stream in frame 1,
    // gUM(audio+camera) in frame 1 returns a stream without prompting;
    promise = promiseMessage("ok");
    yield promiseRequestDevice(true, true, "frame1");
    yield promise;
    yield expectObserverCalled("getUserMedia:request");
    yield promiseNoPopupNotification("webRTC-shareDevices");
    yield expectObserverCalled("getUserMedia:response:allow");
    yield expectObserverCalled("recording-device-events");

    // close the stream
    yield closeStream(false, "frame1", 2);
  }
},

{
  desc: "getUserMedia audio+camera in frame 1 - part II",
  run: function* checkAudioVideoWhileLiveTracksExist_frame_partII() {
    let promise = promisePopupNotificationShown("webRTC-shareDevices");
    yield promiseRequestDevice(true, true, "frame1");
    yield promise;
    yield expectObserverCalled("getUserMedia:request");
    checkDeviceSelectors(true, true);

    let indicator = promiseIndicatorWindow();
    yield promiseMessage("ok", () => {
      PopupNotifications.panel.firstChild.button.click();
    });
    yield expectObserverCalled("getUserMedia:response:allow");
    yield expectObserverCalled("recording-device-events");
    Assert.deepEqual((yield getMediaCaptureState()), {audio: true, video: true},
                     "expected camera and microphone to be shared");

    yield indicator;
    yield checkSharingUI({video: true, audio: true});
    yield expectNoObserverCalled();

    // If there's an active audio+camera stream in frame 1,
    // gUM(audio+camera) in the top level window causes a prompt;
    promise = promisePopupNotificationShown("webRTC-shareDevices");
    yield promiseRequestDevice(true, true);
    yield promise;
    yield expectObserverCalled("getUserMedia:request");
    checkDeviceSelectors(true, true);

    yield promiseMessage(permissionError, () => {
      activateSecondaryAction(kActionDeny);
    });

    yield expectObserverCalled("getUserMedia:response:deny");
    yield expectObserverCalled("recording-window-ended");

    // close the stream
    yield closeStream(false, "frame1");
    SitePermissions.remove(null, "screen", gBrowser.selectedBrowser);
    SitePermissions.remove(null, "camera", gBrowser.selectedBrowser);
    SitePermissions.remove(null, "microphone", gBrowser.selectedBrowser);
  }
},

{
  desc: "getUserMedia audio+camera in frame 1 - reload",
  run: function* checkAudioVideoWhileLiveTracksExist_frame_reload() {
    let promise = promisePopupNotificationShown("webRTC-shareDevices");
    yield promiseRequestDevice(true, true, "frame1");
    yield promise;
    yield expectObserverCalled("getUserMedia:request");
    checkDeviceSelectors(true, true);

    let indicator = promiseIndicatorWindow();
    yield promiseMessage("ok", () => {
      PopupNotifications.panel.firstChild.button.click();
    });
    yield expectObserverCalled("getUserMedia:response:allow");
    yield expectObserverCalled("recording-device-events");
    Assert.deepEqual((yield getMediaCaptureState()), {audio: true, video: true},
                     "expected camera and microphone to be shared");

    yield indicator;
    yield checkSharingUI({video: true, audio: true});
    yield expectNoObserverCalled();

    // reload frame 1
    promise = promiseObserverCalled("recording-device-stopped");
    yield promiseReloadFrame("frame1");
    yield promise;

    yield checkNotSharing();
    yield expectObserverCalled("recording-device-events");
    yield expectObserverCalled("recording-window-ended");
    yield expectNoObserverCalled();

    // After the reload,
    // gUM(audio+camera) in frame 1 causes a prompt.
    promise = promisePopupNotificationShown("webRTC-shareDevices");
    yield promiseRequestDevice(true, true, "frame1");
    yield promise;
    yield expectObserverCalled("getUserMedia:request");
    checkDeviceSelectors(true, true);

    yield promiseMessage(permissionError, () => {
      activateSecondaryAction(kActionDeny);
    });

    yield expectObserverCalled("getUserMedia:response:deny");
    yield expectObserverCalled("recording-window-ended");
    SitePermissions.remove(null, "screen", gBrowser.selectedBrowser);
    SitePermissions.remove(null, "camera", gBrowser.selectedBrowser);
    SitePermissions.remove(null, "microphone", gBrowser.selectedBrowser);
  }
},

{
  desc: "getUserMedia audio+camera at the top level window",
  run: function* checkAudioVideoWhileLiveTracksExist_topLevel() {
    // create an active audio+camera stream at the top level window
    let promise = promisePopupNotificationShown("webRTC-shareDevices");
    yield promiseRequestDevice(true, true);
    yield promise;
    yield expectObserverCalled("getUserMedia:request");
    checkDeviceSelectors(true, true);
    let indicator = promiseIndicatorWindow();

    yield promiseMessage("ok", () => {
      PopupNotifications.panel.firstChild.button.click();
    });

    yield expectObserverCalled("getUserMedia:response:allow");
    yield expectObserverCalled("recording-device-events");
    Assert.deepEqual((yield getMediaCaptureState()), {audio: true, video: true},
                     "expected camera and microphone to be shared");

    yield indicator;
    yield checkSharingUI({audio: true, video: true});

    // If there's an active audio+camera stream at the top level window,
    // gUM(audio+camera) in frame 2 causes a prompt.
    promise = promisePopupNotificationShown("webRTC-shareDevices");
    yield promiseRequestDevice(true, true, "frame2");
    yield promise;
    yield expectObserverCalled("getUserMedia:request");
    checkDeviceSelectors(true, true);

    yield promiseMessage(permissionError, () => {
      activateSecondaryAction(kActionDeny);
    });

    yield expectObserverCalled("getUserMedia:response:deny");
    yield expectObserverCalled("recording-window-ended");

    // close the stream
    yield closeStream(false);
    SitePermissions.remove(null, "screen", gBrowser.selectedBrowser);
    SitePermissions.remove(null, "camera", gBrowser.selectedBrowser);
    SitePermissions.remove(null, "microphone", gBrowser.selectedBrowser);
  }
}

];

function test() {
  waitForExplicitFinish();

  let tab = gBrowser.addTab();
  gBrowser.selectedTab = tab;
  let browser = tab.linkedBrowser;

  browser.messageManager.loadFrameScript(CONTENT_SCRIPT_HELPER, true);

  browser.addEventListener("load", function onload() {
    browser.removeEventListener("load", onload, true);

    is(PopupNotifications._currentNotifications.length, 0,
       "should start the test without any prior popup notification");

    Task.spawn(function* () {
      yield SpecialPowers.pushPrefEnv({"set": [[PREF_PERMISSION_FAKE, true]]});

      for (let testCase of gTests) {
        info(testCase.desc);
        yield testCase.run();

        // Cleanup before the next test
        yield expectNoObserverCalled();
      }
    }).then(finish, ex => {
     Cu.reportError(ex);
     ok(false, "Unexpected Exception: " + ex);
     finish();
    });
  }, true);
  let rootDir = getRootDirectory(gTestPath);
  rootDir = rootDir.replace("chrome://mochitests/content/",
                            "https://example.com/");
  content.location = rootDir + "get_user_media_in_frame.html";
}
