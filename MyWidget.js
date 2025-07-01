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
		widget.body.empty();

		  var grid = new DataGrid({
			className: 'uwa-table',
			columns: [
			  { key: 'name', text: 'Name' },
			  { key: 'type', text: 'Type' },
			  {
				key: 'date',
				text: 'Created On',
				format: function (val) {
				  return new Date(val).toLocaleDateString();
				}
			  }
			],
			data: [
			  { name: 'Product A', type: 'Part', date: '2023-05-01' },
			  { name: 'Product B', type: 'Assembly', date: '2023-07-01' },
			]
		  });

		  grid.inject(widget.body);
    }
  };

  return myWidget;
});
