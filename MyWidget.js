define("MyWidget", [
    "UWA/Core",
    "DS/DataGridView/DataGridView",
    "DS/WAFData/WAFData",
    "DS/PlatformAPI/PlatformAPI",
    "DS/WidgetServices"
], function (UWA, DataGridView, WAFData, PlatformAPI, WidgetServices) {
    var myWidget = {
        onLoad: function () {
            widget.body.empty();
            var container = UWA.createElement("div", {
                id: "grid-container",
                styles: { height: "100%", width: "100%" }
            }).inject(widget.body);

            WidgetServices.getDragAndDropHandler({
                onDrop: function (objects) {
                    if (!objects || !objects.length) return;
                    var id = objects[0].objectId;
                    widget.body.innerHTML = "<p>Loading structure for: " + id + "</p>";
                    fetchChildrenRecursive(id, 0).then(data => renderGrid(data, container));
                }
            });
        }
    };

    function fetchChildrenRecursive(physicalId, level) {
        return new Promise(resolve => {
            WAFData.authenticatedRequest(
                "/resources/v1/modeler/dseng:EngItem/" + physicalId +"/dseng:EngInstance", {
                method: "GET",
                type: "json",
                onComplete: async function (response) {
                    if (!response.children) return resolve([]);
                    let all = [];
                    for (let child of response.children) {
                        child.level = level + 1;
                        all.push(child);
                        let children = await fetchChildrenRecursive(child.id, level + 1);
                        all.push(...children);
                    }
                    resolve(all);
                },
                onFailure: function () { resolve([]); }
            });
        });
    }

    function renderGrid(data, container) {
        new DataGridView({
            columns: [
                { text: "Name", dataIndex: "name", width: 250 },
                { text: "Type", dataIndex: "type" },
                { text: "Level", dataIndex: "level" }
            ],
            data: data
        }).inject(container.empty());
    }

    return myWidget;
});
