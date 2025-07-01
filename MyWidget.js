requirejs.config({
    paths: {
        datagrid: "https://akajaikumar.github.io/EIN/DS/DataGridView/DataGridView"

    },
}),
define("DataGridView", ["datagrid"], function (datagrid) {
    return datagrid;
}),
define("hellow", [
  "UWA/Core",
  "UWA/Drivers/Alone",
  "DS/WAFData/WAFData",
  "DS/PlatformAPI/PlatformAPI",
  "DataGridView"
], function (Core, Alone, WAFData, PlatformAPI, DataGridView) {
  var myWidget = {
    onLoadWidget: function () {
		widget.body.innerHTML = "";
		console.log("widget loaded");
		
		console.log("DataGridView loaded:", DataGridView);
		
    }
  };

  return myWidget;
});
