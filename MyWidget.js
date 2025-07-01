define("hellow", [
  "UWA/Core",
  "UWA/Drivers/Alone",
  "DS/WAFData/WAFData",
  "DS/PlatformAPI/PlatformAPI",
  "UWA/Controls/DataGrid",
], function (Core, Alone, WAFData, PlatformAPI, DataGrid) {
  var myWidget = {
    onLoadWidget: function () {
		widget.body.innerHTML = "";
		console.log("widget loaded");
		
		console.log("DataGrid loaded:", DataGrid);
		
    }
  };

  return myWidget;
});
