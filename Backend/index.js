function doPost(e) {
    try {
        Logger.log(e);
        record_data(e);

        return ContentService
            .createTextOutput(
                JSON.stringify({
                    "result": "success",
                    "data": JSON.stringify(e.parameters)
                })
            )
            .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        Logger.log(error);
        return ContentService
            .createTextOutput(JSON.stringify({ "result": "error", "error": error }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function record_data(e) {
    var lock = LockService.getDocumentLock();
    lock.waitLock(30000);

    try {
        Logger.log(JSON.stringify(e));

        var doc = SpreadsheetApp.getActiveSpreadsheet();
        var sheetName = e.parameters.formGoogleSheetName || "Members";
        var sheet = doc.getSheetByName(sheetName);

        var authValue = getFieldFromData("auth", e.parameters) || "null";
        var idValue = getFieldFromData("id", e.parameters) || "null";
        var tokenValue = getFieldFromData("token", e.parameters) || "null";

        if (authValue === "null" || idValue === "null" || tokenValue === "null") {
            Logger.log("Some required fields are null. Data not recorded.");
            return;
        }

        var tokenRange = sheet.getRange(2, 2, 1, 8).getValues()[0];
        if (tokenRange.indexOf(tokenValue) === -1) {
            Logger.log("Token not found in B2:I2. Data not recorded.");
            return;
        }

        var oldHeader = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var newHeader = oldHeader.slice();
        var fieldsFromForm = getDataColumns(e.parameters);
        var row = [new Date()];

        for (var i = 1; i < oldHeader.length; i++) {
            var field = oldHeader[i];
            if (field === "token") continue;
            var output = getFieldFromData(field, e.parameters);
            row.push(output);

            var formIndex = fieldsFromForm.indexOf(field);
            if (formIndex > -1) {
                fieldsFromForm.splice(formIndex, 1);
            }
        }

        for (var i = 0; i < fieldsFromForm.length; i++) {
            var field = fieldsFromForm[i];
            if (field === "token") continue;
            var output = getFieldFromData(field, e.parameters);
            row.push(output);
            newHeader.push(field);
        }

        if (newHeader.length > oldHeader.length) {
            sheet.getRange(1, 1, 1, newHeader.length).setValues([newHeader]);
        }

        var authFieldIndex = newHeader.indexOf("auth");
        var authValue = getFieldFromData("auth", e.parameters);

        if (authFieldIndex > -1 && authValue) {
            var dataRange = sheet.getRange(2, authFieldIndex + 1, sheet.getLastRow() - 1);
            var authColumn = dataRange.getValues();

            for (var i = 0; i < authColumn.length; i++) {
                if (authColumn[i][0].toString().trim() === authValue.toString().trim()) {
                    sheet.getRange(i + 2, 1, 1, row.length).setValues([row]);
                    return;
                }
            }
        }

        var nextRow = sheet.getLastRow() + 1;
        sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

    } catch (error) {
        Logger.log(error);
    } finally {
        lock.releaseLock();
        return;
    }
}

function getDataColumns(data) {
    return Object.keys(data).filter(function (column) {
        return !(column === 'token');
    });
}

function getFieldFromData(field, data) {
    var values = data[field] || '';
    var output = values.join ? values.join(', ') : values;
    return output;
}