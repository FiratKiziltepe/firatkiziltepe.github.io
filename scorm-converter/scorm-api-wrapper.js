/**
 * SCORM 1.2 API Wrapper
 * Bu dosya SCORM içeriğinin LMS ile iletişim kurmasını sağlar
 */

var API = null;
var findAPITries = 0;
var maxTries = 500;

/**
 * LMS API'sini bul
 */
function findAPI(win) {
    while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
        findAPITries++;
        if (findAPITries > maxTries) {
            return null;
        }
        win = win.parent;
    }
    return win.API;
}

/**
 * API'yi al
 */
function getAPI() {
    var theAPI = findAPI(window);
    if ((theAPI == null) && (window.opener != null) && (typeof(window.opener) != "undefined")) {
        theAPI = findAPI(window.opener);
    }
    if (theAPI == null) {
        console.log("SCORM API bulunamadı. İçerik standalone modda çalışıyor.");
    }
    return theAPI;
}

/**
 * SCORM oturumunu başlat
 */
function initializeSCORM() {
    API = getAPI();

    if (API == null) {
        console.log("API bulunamadı, standalone modda devam ediliyor");
        return false;
    }

    var result = API.LMSInitialize("");

    if (result == "true") {
        console.log("SCORM başarıyla başlatıldı");

        // Öğrenci bilgilerini al
        var studentName = API.LMSGetValue("cmi.core.student_name");
        var studentId = API.LMSGetValue("cmi.core.student_id");

        console.log("Öğrenci: " + studentName + " (ID: " + studentId + ")");

        // Ders durumunu kontrol et
        var lessonStatus = API.LMSGetValue("cmi.core.lesson_status");

        if (lessonStatus == "not attempted") {
            // İlk kez açılıyorsa, durumu güncelle
            API.LMSSetValue("cmi.core.lesson_status", "incomplete");
            API.LMSCommit("");
        }

        return true;
    } else {
        console.log("SCORM başlatılamadı");
        var errorCode = API.LMSGetLastError();
        var errorString = API.LMSGetErrorString(errorCode);
        console.log("Hata: " + errorCode + " - " + errorString);
        return false;
    }
}

/**
 * SCORM değeri ayarla
 */
function setSCORMValue(element, value) {
    if (API == null) {
        console.log("API mevcut değil");
        return false;
    }

    var result = API.LMSSetValue(element, value);

    if (result == "true") {
        console.log("Değer ayarlandı: " + element + " = " + value);
        return true;
    } else {
        console.log("Değer ayarlanamadı: " + element);
        var errorCode = API.LMSGetLastError();
        var errorString = API.LMSGetErrorString(errorCode);
        console.log("Hata: " + errorCode + " - " + errorString);
        return false;
    }
}

/**
 * SCORM değeri al
 */
function getSCORMValue(element) {
    if (API == null) {
        console.log("API mevcut değil");
        return "";
    }

    var value = API.LMSGetValue(element);

    if (value != "") {
        console.log("Değer alındı: " + element + " = " + value);
    } else {
        var errorCode = API.LMSGetLastError();
        if (errorCode != "0") {
            var errorString = API.LMSGetErrorString(errorCode);
            console.log("Değer alınamadı: " + element);
            console.log("Hata: " + errorCode + " - " + errorString);
        }
    }

    return value;
}

/**
 * Değişiklikleri kaydet
 */
function commitSCORM() {
    if (API == null) {
        console.log("API mevcut değil");
        return false;
    }

    var result = API.LMSCommit("");

    if (result == "true") {
        console.log("Değişiklikler kaydedildi");
        return true;
    } else {
        console.log("Değişiklikler kaydedilemedi");
        var errorCode = API.LMSGetLastError();
        var errorString = API.LMSGetErrorString(errorCode);
        console.log("Hata: " + errorCode + " - " + errorString);
        return false;
    }
}

/**
 * Dersi tamamlandı olarak işaretle
 */
function completeSCORM() {
    if (API != null) {
        setSCORMValue("cmi.core.lesson_status", "completed");
        setSCORMValue("cmi.core.score.raw", "100");
        setSCORMValue("cmi.core.score.min", "0");
        setSCORMValue("cmi.core.score.max", "100");
        commitSCORM();
    }
}

/**
 * Dersi başarılı olarak işaretle
 */
function passSCORM(score) {
    if (API != null) {
        score = score || 100;
        setSCORMValue("cmi.core.lesson_status", "passed");
        setSCORMValue("cmi.core.score.raw", score.toString());
        setSCORMValue("cmi.core.score.min", "0");
        setSCORMValue("cmi.core.score.max", "100");
        commitSCORM();
    }
}

/**
 * Dersi başarısız olarak işaretle
 */
function failSCORM(score) {
    if (API != null) {
        score = score || 0;
        setSCORMValue("cmi.core.lesson_status", "failed");
        setSCORMValue("cmi.core.score.raw", score.toString());
        setSCORMValue("cmi.core.score.min", "0");
        setSCORMValue("cmi.core.score.max", "100");
        commitSCORM();
    }
}

/**
 * SCORM oturumunu sonlandır
 */
function terminateSCORM() {
    if (API == null) {
        console.log("API mevcut değil");
        return false;
    }

    var result = API.LMSFinish("");

    if (result == "true") {
        console.log("SCORM oturumu sonlandırıldı");
        return true;
    } else {
        console.log("SCORM oturumu sonlandırılamadı");
        var errorCode = API.LMSGetLastError();
        var errorString = API.LMSGetErrorString(errorCode);
        console.log("Hata: " + errorCode + " - " + errorString);
        return false;
    }
}

/**
 * Sayfa kapatıldığında SCORM'u sonlandır
 */
window.addEventListener('beforeunload', function() {
    terminateSCORM();
});

/**
 * Sayfa yüklendiğinde SCORM'u başlat
 */
window.addEventListener('load', function() {
    initializeSCORM();
});

// Global fonksiyonları export et
window.SCORM = {
    initialize: initializeSCORM,
    setValue: setSCORMValue,
    getValue: getSCORMValue,
    commit: commitSCORM,
    complete: completeSCORM,
    pass: passSCORM,
    fail: failSCORM,
    terminate: terminateSCORM
};
