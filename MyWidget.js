define("hellow", ["UWA/Core",
  "UWA/Drivers/Alone",
  "DS/PPWDataGridView/PPWDataGridView",
  "DS/WAFData/WAFData",
  "DS/PlatformAPI/PlatformAPI"], function (Core, Alone, DataGrid, WAFData,PlatformAPI) {
	    var myWidget = {
			onLoadWidget: function () {
				consoel.log("WIdget Loaded");
				widget.body.innerHTML = "";
				
			},
		};
	return myWidget;
});
