function fetchLabelsFromIDs(classId) {
    return new Promise((resolve, reject) => {
        i3DXCompassServices.getServiceUrl({
            platformId: platformId,
            serviceName: '3DSpace',
            onComplete: function (URL3DSpace) {
                let baseUrl = typeof URL3DSpace === "string" ? URL3DSpace : URL3DSpace[0].url;
                if (baseUrl.endsWith("/3dspace")) baseUrl = baseUrl.replace("/3dspace", "");

                const csrfURL = baseUrl + "/resources/v1/application/CSRF";

                WAFData.authenticatedRequest(csrfURL, {
                    method: "GET",
                    type: "json",
                    onComplete: function (csrfData) {
                        const csrfToken = csrfData.csrf.value;
                        const csrfHeader = csrfData.csrf.name;

                        const classURL = baseUrl + "/resources/v1/modeler/dslib/dslib:Class/" + classId + "?$mask=dslib.DSLibMask.DSLib";

                        WAFData.authenticatedRequest(classURL, {
                            method: "GET",
                            type: "json",
                            headers: {
                                "Content-Type": "application/json",
                                "Accept": "application/json",
                                "SecurityContext": "ctx::VPLMProjectLeader.Company Name.APTIV INDIA",
                                [csrfHeader]: csrfToken
                            },
                            onComplete: function (response) {
                                try {
                                    if (response && response.member && response.member.length > 0) {
                                        const classInfo = response.member[0];
                                        const title = classInfo.title || '';
                                        const type = classInfo.type || '';
                                        const id = classInfo.id;

                                        resolve({ title, type, id });
                                    } else {
                                        resolve({ title: '', type: '', id: classId });
                                    }
                                } catch (e) {
                                    reject("Error parsing response: " + e);
                                }
                            },
                            onFailure: function (err) {
                                reject("Failed to fetch class: " + JSON.stringify(err));
                            }
                        });
                    },
                    onFailure: function (err) {
                        reject("Failed to get CSRF token: " + JSON.stringify(err));
                    }
                });
            },
            onFailure: function () {
                reject("Failed to get 3DSpace URL");
            }
        });
    });
}
