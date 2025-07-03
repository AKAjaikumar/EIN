define("hellow", [
  "UWA/Core",
  "UWA/Drivers/Alone",
  "DS/WAFData/WAFData",
  "DS/PlatformAPI/PlatformAPI",
  "UWA/Controls/Popup",
  "UWA/Controls/DataGrid",
  "DS/DataDragAndDrop/DataDragAndDrop",
  "DS/i3DXCompassServices/i3DXCompassServices"
], function (Core, Alone, WAFData, PlatformAPI, Popup, DataGrid, DataDnD, i3DXCompassServices) {
  var grid;
  var rowsMap = {};
  var platformId;
  var myWidget = {
    onLoadWidget: function () {
		rowsMap = {};
	 injectRemoteUIKitCSS();
      widget.body.innerHTML = "";
      console.log("widget loaded");
      platformId = widget.getValue("x3dPlatformId");
      console.log("platformId:", platformId);
      widget.body.empty();
      widget.body.setStyle("border", "2px dashed #666");
      widget.body.setStyle("padding", "20px");
      widget.body.setText("Drag a Physical Product here");

      //createGrid([]);

      DataDnD.droppable(widget.body, {
        enter: function (el, event) {
          if (el && el.classList) el.classList.add("drag-over");
        },
        over: function (el, event) {
          return true;
        },
        leave: function (el, event) {
          if (el && el.classList) el.classList.remove("drag-over");
        },
        drop: function (dropData, el, event) {
		  if (el && el.classList) el.classList.remove("drag-over");

		  try {
			const parsed = typeof dropData === 'string' ? JSON.parse(dropData) : dropData;
			console.log("Dropped Data:", parsed);

			const items = parsed?.data?.items;
			if (!Array.isArray(items) || items.length === 0) {
			  console.warn("No items found in dropped data");
			  return;
			}

			let dropCount = items.length;
			items.forEach(engItem => {
			  const pid = engItem?.physicalId || engItem?.objectId || engItem?.id;
			  if (!pid) {
				console.warn("Invalid object:", engItem);
				dropCount--;
				return;
			  }

			  const isNew = !rowsMap[pid];
			  const rootRow = {
				id: pid,
				name: engItem?.displayName || "Root",
				type: engItem?.objectType || "VPMReference",
				created: engItem?.created || new Date().toISOString(),
				level: 0,
				enterpriseItemNumber: '',
				hasChildren: true,
				_expanded: true,
				parentId: null
			  };

			  rowsMap[pid] = rootRow;

			  fetchChildren(pid, 1, rootRow, function () {
				dropCount--;
				if (dropCount === 0) {
				  updateDataGrid(); 
				}
			  });
			});
		  } catch (e) {
			console.error("❌ Failed to parse dropped data:", e);
		  }
		}
      });
    }
  };

  function createGrid(data) {
  if (grid) grid.destroy();

  widget.body.empty();

  // Toolbar
  const toolbar = UWA.createElement('div', {
    class: 'toolbar',
    styles: {
      display: 'flex',
      justifyContent: 'flex-start',
      gap: '10px',
      padding: '8px',
      background: '#f8f8f8',
      borderBottom: '1px solid #ddd'
    }
  });

 const addButton = UWA.createElement('button', {
  text: 'Set EIN',
  styles: {
    padding: '6px 12px',
    background: '#0073E6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  events: {
    click: function () {
      const selectedCheckboxes = widget.body.querySelectorAll('.row-selector:checked');
      if (selectedCheckboxes.length === 0) {
        alert("No rows selected!");
        return;
      }

      const selectedData = Array.from(selectedCheckboxes).map(cb => {
        const rowId = cb.getAttribute('data-id');
        const rowData = rowsMap[rowId];
        if (!rowData) return null;
        return {
          name: rowData.name,
          quantity: rowData.quantity || "N/A",
          partNumber: rowData.enterpriseItemNumber || ''
        };
      }).filter(Boolean);

      const invalidRows = selectedData.filter(row => {
        const fullRow = Object.values(rowsMap).find(r => r.name === row.name);
        if (!fullRow) return true;
        const state = (fullRow.maturityState || "").split(".").pop().toUpperCase();
        return state !== "IN_WORK";
      });

      if (invalidRows.length > 0) {
        const names = invalidRows.map(r => r.name).join(", ");
        alert(`Cannot proceed. Only 'IN_WORK' objects can be set.\nOffending object(s): ${names}`);
        return;
      } else {
		  const popupContent = UWA.createElement('div', {
			  styles: {
				padding: '10px',
				fontSize: '14px'
			  }
			});

			UWA.createElement('div', {
			  text: "Do you want to proceed with setting EIN for the selected items?",
			  styles: {
				marginTop: '10px',
				marginBottom: '10px'
			  }
			}).inject(popupContent);

			const buttonContainer = UWA.createElement('div', {
			  styles: {
				marginTop: '10px',
				display: 'flex',
				gap: '10px',
				justifyContent: 'flex-end'
			  }
			}).inject(popupContent);

			const confirmPopup = new Popup({
			  title: "Confirm Action",
			  closeButton: true,
			  content: popupContent,
			  elements: {
				container: UWA.createElement('div', {
				  styles: {
					position: 'fixed',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					zIndex: 10000
				  }
				}).inject(document.body)
			  }
			});

			UWA.createElement('button', {
			  text: 'Yes',
			  class: 'btn btn-primary',
			  events: {
				click: () => {
				  confirmPopup.hide();
				  alert('EIN Set logic can be triggered here');
				}
			  }
			}).inject(buttonContainer);

			UWA.createElement('button', {
			  text: 'Cancel',
			  class: 'btn',
			  events: {
				click: () => confirmPopup.hide()
			  }
			}).inject(buttonContainer);

			// Show the popup
			confirmPopup.inject(widget.body);

	  }
    }
  }
});


  toolbar.appendChild(addButton);
  widget.body.appendChild(toolbar);

  // Create scroll container before injecting
  const scrollContainer = UWA.createElement('div', {
    class: 'grid-scroll-container',
    styles: {
      height: '400px',
      overflowY: 'auto',
      overflowX: 'hidden',
      border: '1px solid #ccc'
    }
  });

  widget.body.appendChild(scrollContainer); // Attach scroll container first

  // Now create the DataGrid
  grid = new DataGrid({
    className: 'uwa-table',
    selectable: true,
    multiSelect: true,
    columns: [
      {
        key: 'select',
        text: '<input type="checkbox" class="row-selector" id="select-all-checkbox" />',
        width: 30,
        dataIndex: 'id',
        format: function (val) {
          return `<input type="checkbox" class="row-selector" data-id="${val}" />`;
        }
      },
      {
        key: 'name',
        text: 'Name',
        dataIndex: 'name',
        format: val => `<div>${val || ''}</div>`
      },
      {
        key: 'structureLevel',
        text: 'Structure Level',
        dataIndex: 'level',
        format: val => (typeof val === 'number') ? (val + 1).toString() : ''
      },
      {
        key: 'enterpriseItemNumber',
        text: 'Enterprise Item Number',
        dataIndex: 'enterpriseItemNumber'
      },
      {
        key: 'maturityState',
        text: 'Maturity State',
        dataIndex: 'maturityState',
        format: function (val) {
          const state = val?.split('.').pop() || '';
          const colorMap = {
            'FROZEN': '#008000',
            'IN_WORK': '#0073E6',
            'RELEASED': '#FFA500',
            'OBSOLETE': '#8B0000'
          };
          const bgColor = colorMap[state.toUpperCase()] || '#777';
          return `<span style="display:inline-block;padding:4px 8px;background-color:${bgColor};color:white;border-radius:4px;font-size:12px;">${state.replace(/_/g, ' ')}</span>`;
        }
      }
    ],
    data: data
  });

  // Inject DataGrid into scrollable container
  grid.inject(scrollContainer);

  // Setup checkbox sync
  setTimeout(() => {
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', function () {
        const checkboxes = widget.body.querySelectorAll('.row-selector');
        checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
      });
    }
  }, 300);
}




  function fetchChildren(pid, level, parentRow, callback) {
	  console.log("Fetched children for", pid, parentRow);
    i3DXCompassServices.getServiceUrl({
      platformId: widget.getValue("x3dPlatformId"),
      serviceName: "3DSpace",
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

            const postUrl = baseUrl + "/cvservlet/progressiveexpand/v2?tenant=" + platformId + "&output_format=cvjson";

            const postData = {
              batch: {
                expands: [{
                  aggregation_processors: [{
                    truncate: {
                      max_distance_from_prefix: 1,
                      prefix_filter: {
                        prefix_path: [{ physical_id_path: [pid] }]
                      }
                    }
                  }],
                  filter: {
                    and: {
                      filters: [
                        {
                          prefix_filter: {
                            prefix_path: [{ physical_id_path: [pid] }]
                          }
                        },
                        {
                          and: {
                            filters: [{
                              sequence_filter: {
                                sequence: [{
                                  uql: '((flattenedtaxonomies:"reltypes/VPMInstance") OR (flattenedtaxonomies:"reltypes/VPMRepInstance") OR (flattenedtaxonomies:"reltypes/SpecificationDocument")) AND (NOT (ds6wg_58_synchroebomext_46_v_95_inebomuser:"FALSE"))'
                                }]
                              }
                            }]
                          }
                        }
                      ]
                    }
                  },
                  graph: {
                   
                    descending_condition_relation: {
                      uql: 'NOT (flattenedtaxonomies:"reltypes/XCADBaseDependency") AND ((flattenedtaxonomies:"reltypes/VPMInstance") OR (flattenedtaxonomies:"reltypes/VPMRepInstance") OR (flattenedtaxonomies:"reltypes/SpecificationDocument"))'
                    }
                  },
                  label: "expand-root-" + Date.now(),
                  root: {
                    physical_id: pid
                  }
                }]
              },
              outputs: {
                format: "entity_relation_occurrence",
                select_object: ["ds6w:label", "ds6w:created", "type", "physicalid","ds6wg:EnterpriseExtension.V_PartNumber","ds6w:status"],
                select_relation: ["ds6w:type", "type", "physicalid"]
              }
            };

            WAFData.authenticatedRequest(postUrl, {
              method: "POST",
              type: "json",
              headers: {
                "Content-Type": "application/json",
                'SecurityContext': 'VPLMProjectLeader.Company Name.APTIV INDIA',
                [csrfHeader]: csrfToken
              },
              data: JSON.stringify(postData),
              onComplete: function (resp) {
                const children = [];
				const results = resp.results || [];

				const rootObj = results.find(item => item.resourceid === pid && item.type === "VPMReference");
				console.log("rootObj:"+rootObj);
				console.log("rowsMap[pid]:"+rowsMap[pid]);
				console.log("pid:"+pid);
				if (rootObj) {
				  const rootPartNumber = rootObj["ds6wg:EnterpriseExtension.V_PartNumber"]
					|| (rootObj.attributes ? getAttributeValue(rootObj.attributes, "ds6wg:EnterpriseExtension.V_PartNumber") : '');
					console.log("rootPartNumber:"+rootPartNumber);
					if (rowsMap[pid]) {
   
					rowsMap[pid].enterpriseItemNumber = rootPartNumber;
					rowsMap[pid].maturityState = rootObj["ds6w:status"];
					parentRow = rowsMap[pid];
					} else {
				   
					const rootRow = {
					  id: rootObj.resourceid,
					  name: rootObj["ds6w:label"] || "Root",
					  type: rootObj["type"] || "VPMReference",
					  created: rootObj["ds6w:created"] || new Date().toISOString(),
					  level: 0,
					  enterpriseItemNumber: rootPartNumber,
					  maturityState: rootObj["ds6w:status"] ,
					  hasChildren: true,
					  _expanded: true,
					  expandcol: '',
					  parentId: null
					};
					rowsMap[rootObj.resourceid] = rootRow;
					parentRow = rootRow;
				  }
				}
				const objectMap = {};
				results.forEach(item => {
				  if (item.type === "VPMReference") {
					objectMap[item.resourceid] = item;
				  }
				});

				results.forEach(item => {
				  if (item.type === "VPMInstance" && item.from === pid) {
					const childObj = objectMap[item.to];
					if (childObj) {
					const partNumber = childObj["ds6wg:EnterpriseExtension.V_PartNumber"]
								|| (childObj.attributes ? getAttributeValue(childObj.attributes, "ds6wg:EnterpriseExtension.V_PartNumber") : '');
						console.log("partNumber=="+partNumber);
					  const row = {
						id: childObj.resourceid,
						name: childObj["ds6w:label"],
						type: childObj["type"],
						created: childObj["ds6w:created"],
						level: level,
						enterpriseItemNumber: partNumber,
						maturityState: childObj["ds6w:status"] ,
						hasChildren: true,
						_expanded: true,
						expandcol: '', 
						parentId: parentRow ? parentRow.id : null
					  };
					  children.push(row);
					  rowsMap[childObj.resourceid] = row;
					}
				  }
				});

               parentRow._children = children || [];
				parentRow._expanded = true;

				if (!children || children.length === 0) {
				  callback && callback();  // <== always callback even if no children
				} else {
				  let remaining = children.length;
				  children.forEach(child => {
					fetchChildren(child.id, child.level + 1, child, function () {
					  remaining--;
					  if (remaining === 0) {
						callback && callback();
					  }
					});
				  });
				}
              },
              onFailure: function (err) {
                console.error("Failed to fetch structure from progressiveexpand:", err);
              }
            });
          },
          onFailure: function (err) {
            console.error("Failed to fetch CSRF token:", err);
          }
        });
      },
      onFailure: function () {
        console.error("Failed to get 3DSpace URL");
      }
    });
  }
  function getAttributeValue(attributesArray, attrName) {
	  for (let i = 0; i < attributesArray.length; i++) {
		if (attributesArray[i].name === attrName) {
		  return attributesArray[i].value;
		}
	  }
	  return '';
	}
  function expandChildren(row) {
    if (!row._children) {
      fetchChildren(row.id, row.level + 1, row);
    } else {
      row._expanded = true;
      updateDataGrid();
    }
  }

  function collapseChildren(row) {
    row._expanded = false;
    updateDataGrid();
  }

  function updateDataGrid() {
  const result = [];

  function addRowRecursive(row) {
    result.push(row);
    if (row._expanded && row._children) {
      row._children.forEach(addRowRecursive);
    }
  }

  Object.values(rowsMap).forEach((row) => {
    if (!row.parentId) addRowRecursive(row);
  });

 createGrid(result); 
}
function injectRemoteUIKitCSS() {
				const style = document.createElement("style");
					style.textContent = `
					.grid-scroll-container {
					  max-height: 400px;
					  overflow-y: auto;
					  overflow-x: hidden;
					}

					.uwa-table {
					  width: 100%;
					  border-collapse: collapse;
					}

					/* Header should NOT be sticky */
					.uwa-table thead th {
					  position: relative;
					  background: #d3d3d3;
					  z-index: 1;
					  text-align: left;
					  vertical-align: middle;
					  padding: 8px;
					}

					.uwa-table thead th:first-child {
					  text-align: center;
					  width: 40px;
					}

					/* Data cells */
					.uwa-table td {
					  text-align: left !important;
					  vertical-align: middle;
					  padding: 6px 10px;
					  border: 1px solid #ddd;
					}

					.uwa-table td:first-child {
					  text-align: center;
					}

					.uwa-table input[type="checkbox"] {
					  width: 16px;
					  height: 16px;
					  cursor: pointer;
					}

					/* Row striping */
					.uwa-table .dataRow:nth-child(even) {
					  background-color: #f5f5f5;
					}

					.uwa-table .dataRow:nth-child(odd) {
					  background-color: #ffffff;
					}
					`;
					document.head.appendChild(style);

			  const link = document.createElement("link");
			  link.rel = "stylesheet";
			  link.href = "/resources/"+widget.getValue("x3dPlatformId")+"/en/webapps/UIKIT/UIKIT.css";
			  document.head.appendChild(link);
			  
}
  return myWidget;
});
