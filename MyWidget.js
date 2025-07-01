define("hellow", [
  "UWA/Core",
  "UWA/Drivers/Alone",
  "DS/WAFData/WAFData",
  "DS/PlatformAPI/PlatformAPI"
], function (Core, Alone, WAFData, PlatformAPI) {
  var myWidget = {
    onLoadWidget: function () {
		widget.body.innerHTML = "";
		console.log("widget loaded");
		require(["DS/DataGridView/DataGridView"], function (DataGridView) {
			console.log("DataGridView loaded:", DataGridView);
		});
		
    }
  };

  return myWidget;
});
