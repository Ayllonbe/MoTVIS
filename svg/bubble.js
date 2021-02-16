var img_bubble = (function() {
	var tooltip = d3.select("body").append("div").attr("class", "toolTip"); // Inicializacion de bocadillos en la imagen
	var zoom = d3.zoom().scaleExtent([1, 10]).on("zoom", zoomed); // para hacer zoom con el raton
	var svg = d3.select("#bubble").append("g")
	.attr("width", 960)
	.attr("height", 960)
	;
	function zoomed() {
		g.attr("transform", d3.event.transform);
	}
	var margin = 20,
		diameter = svg.attr("width"),
		g = svg.append("g").attr("id", "root"),
		width = svg.attr("width") - margin,
		height = svg.attr("height") - margin;
	console.log(width+" "+height);
	svg.attr('viewBox','0 0 '+Math.min(width,height) +' '+Math.min(width,height) )
	.attr("transform", "translate(" + ((920 / 2) + 30) + "," + ((920 / 2) + 30) + ")").call(zoom)
	var nodes, node, circle, rectangle;
	var pack = d3.pack().size([diameter - margin, diameter - margin]).padding(2);
	var focus, view, leaves;
	var pvMin = [],
		Maxv;
	return {
		draw: function(root, mode) {
			root = d3.hierarchy(root).sum(function(d) {
					return d.size;
				})
				.sort(function(a, b) {
					return b.value - a.value;
				});
			focus = root,
				packRoot = pack(root),
				leaves = packRoot.leaves();
			nodes = packRoot.descendants();
			leaves.forEach(function(x) {
				if (x.data.pvalue != undefined) {
					pvMin.push(-Math.log(x.data.pvalue));
				}
			})
			Maxv = Math.max.apply(Math, pvMin.map(function(o) {
				return o;
			}));
			leaves.forEach(function(x) {
				if (x.data.pvalue != undefined) {
					x.rectW = (x.r * Math.pow(2, 1 / 2)) * (-Math.log(x.data.pvalue)) /
						Maxv;
				}
			})
			mode(root);
			nodes.forEach(function(d) {
				d.equalNode = [];
			});
			for (var i = 0; i < leaves.length; i++) {
				ni = leaves[i];
				for (var j = i + 1; j < leaves.length; j++) {
					if (ni.data.id === leaves[j].data.id) {
						ni.equalNode.push(leaves[j]);
						leaves[j].equalNode.push(ni);
					}
				}
			};
			var sett = new Set();
			var setd = new Set();
			var duration = 200;
			var delay = 0;
			circle = g.selectAll("circle").data(nodes, function(d) {
				//	console.log(d.r +" " +d.y+" " +d.x +" "+ d.data.name);
				return d.id || (d.id = ++i);
			}).enter().append("g").attr("id", function(d) {
				return "n" + d.id
			}).append("circle").attr("class", function(d) {
				return d.parent ? d.children ? "node" : "node node--leaf" :
					"node node--root";
			}).style("fill", function(d) {
				return d.children ? d3.hcl(d.color.h, d.color.c, d.color.l) : null;
			}).on("mouseover", function(d) {
				tooltip.style("left", d3.event.pageX - 70 + "px").style("top", d3.event
					.pageY + 30 + "px").style("display", "inline");
				if (d.children) {
					tooltip.html((d.data.name));
				} else {
					tooltip.html((d.data.name + " -- " + d.data.id) + "<br>" + "Pvalue: " +
						(d.data.pvalue) + " size: " + d.data.size);
				};
				if (d.equalNode.length > 0) {
					d.equalNode.forEach(function(x) {
						var top = d3.select(document.getElementById("root"));
						var cirEq = d3.select(document.getElementById("n" + x.id));
						var transform = cirEq.selectAll("circle").attr("transform");
						top = top.append("circle").attr("id", "circleTMP").attr(
							"transform", transform);
						top.style("stroke", "black").style("stroke-width", 2).style("fill",
							d3.hcl(d.color.h, d.color.c, d.color.l));
						(function loop() {
							top.transition().duration(500).attr("stroke-width", 1).attr("r",
									x.r * 2.8).transition().duration(250).attr('stroke-width', 0.5)
								.attr("r", x.r).on("end", loop);
						})();
					});
				};
			}).on("mouseout", function(d) {
				tooltip.style("display", "none");
				if (d.equalNode.length > 0) {
					//d3.select(this).style("fill", null);
					d.equalNode.forEach(function(x) {
						var cirEq = g.selectAll("#circleTMP").transition().delay(0).duration(
							500).attr("r", x.r).remove();
					});
				}
			}).on("click", function(d) {
				if (focus !== d) {
					img_bubble.zoom(d)
				} else {
					if (d.parent !== null) img_bubble.zoom(d.parent)
				};
				d3.event.stopPropagation();
			}).on('dblclick', function(d) {
				if (focus === d) img_bubble.zoom(root);
				d3.event.stopPropagation();
			})
			leaves.forEach(function(d) {
				d.eqposY = {};
				d.eqrectW = {};
			});
			leaves.forEach(function(d) {
				if (d.equalNode.length >= 1) {
					var eq = [d];
					d.equalNode.forEach(function(x) {
						eq.push(x);
					});
					d.rectH = Math.min(((d.r * Math.pow(2, 1 / 2)) / 2) / eq.length, 3);
					d.posX = -d.r / (Math.pow(2, 1 / 2));
					d.posY = -eq.length * d.rectH / 2
					d.gap = d.rectH * 0.05;
					eq.forEach(function(x, i) {
							rectangle = d3.select(document.getElementById("n" + d.id)).append(
								"rect").attr("class", "Noderect").attr("id", "n" + x.id + "n").style(
								"fill", d3.hcl(x.color.h, x.color.c, x.color.l)).style(
								"fill-opacity", 1).style("pointer-events", "none").style(
								"stroke-width", d.gap).style("stroke", "white").on("mousemove",
								function() {
									tooltip.style("left", d3.event.pageX - 60 + "px").style("top",
										d3.event.pageY + 30 + "px").style("display", "inline").html((
											x.data.name) + "<br>" + "pvalue " + (x.data.pvalue) +
										" size: " + x.data.size);
								});
							d.eqposY["n" + d.id + "n" + x.id + "n"] = d.posY + d.rectH * i
							d.eqrectW["n" + d.id + "n" + x.id + "n"] = x.rectW
						})
				} else if (d.data.pvalue != undefined) {
					var eq = [d];
					d.equalNode.forEach(function(x) {
						eq.push(x);
					});
					d.rectH = Math.min(((d.r * Math.pow(2, 1 / 2)) / 2) / eq.length, 3);
					d.posX = -d.r / (Math.pow(2, 1 / 2));
					d.posY = -eq.length * d.rectH / 2
					eq.forEach(function(x, i) {
							rectangle = d3.select(document.getElementById("n" + d.id)).append(
									"rect").attr("class", "Noderect").attr("id", "n" + x.id + "n").style(
									"fill", d3.hcl(x.color.h, x.color.c, x.color.l)).style(
									"fill-opacity", 1)
								.style("pointer-events", "none")
							d.eqposY["n" + d.id + "n" + x.id + "n"] = d.posY + (d.rectH) * i
							d.eqrectW["n" + d.id + "n" + x.id + "n"] = x.rectW
						})
				}
			})
			var text = g.selectAll("text").data(nodes).enter().append("text").attr(
				"class", "label").attr("id", function(d) {
				return "t"
			}).style("fill-opacity", function(d) {
				return d.parent === root ? 1 : 0;
			}).style("display", function(d) {
				return d.parent === root ? "inline" : "none";
			}).text(function(d) {
				return d.children ? d.data.name : d.data.id;
			});
			node = g.selectAll("circle,rect,text");
			svg.style("background", "#ffffff")
			img_bubble.zoomTo([root.x, root.y, root.r * 2 + margin]);
		},
		zoom: function zoom(d) {
			var focus0 = focus;
			focus = d;
			var treeI = [];
			var nodetree = img_tree.root()._descendants;
			if (d.children) {
				nodetree.forEach(function(x) {
					if (x.children) {
						x.children = null;
					}
					if (x.data.name === d.data.name && d.data.id === x.data.id) {
						treeI.push(x);
					}
				});
			} else {
				nodetree.forEach(function(x) {
					if (x.children) {
						x.children = null;
					}
					if (x.data.id != undefined && d.data.id === x.data.id) {
						treeI.push(x);
					}
				});
			}
			var transition = d3.transition().duration(d3.event.altKey ? 7500 : 750).tween(
				"zoom",
				function(d) {
					var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 +
						margin / 2
					]);
					return function(t) {
						img_bubble.zoomTo(i(t));
					};
				});
			transition.selectAll("#tmp").duration(0).remove();
			transition.selectAll(".bar").remove();
			if (!d.children) {
				//console.log(d.r);
				var tmp = d3.select(document.getElementById("n" + d.id)).append("g").attr(
					"id", "tmp").attr("class", "labeltmp");
				tmp.append("text").text(function(d) {
					return d.data.name + " ( " + d.data.id + " )"
				}).attr("y", -(d.r * 25));
				var bary = -(d.r * 8),
					barx = -(d.r * 10);
				var data = [];
				var sep = 0;
			}
			img_tree.update2(treeI);
			transition.selectAll("#t").filter(function(d) {
				return d.parent === focus || this.style.display === "inline";
			}).style("fill-opacity", function(d) {
				return d.parent === focus ? 1 : 0;
			}).on("start", function(d) {
				if (d.parent === focus) this.style.display = "inline";
			}).on("end", function(d) {
				if (d.parent !== focus) this.style.display = "none";
			});
		},
		zoomTree: function zoom(d, focus) {
			var focus0 = focus;
			focus = d;
			var treeI = [];
			if (!d.children) {
				focus = d.parent
			}
			var transition = d3.transition().duration(d3.event.altKey ? 7500 : 750).tween(
				"zoom",
				function(d) {
					var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 +
						margin
					]);
					return function(t) {
						img_bubble.zoomTo(i(t));
					};
				});
			transition.selectAll("text").filter(function(d) {
				return d.parent === focus || this.style.display === "inline";
			}).style("fill-opacity", function(d) {
				return d.parent === focus ? 1 : 0;
			}).on("start", function(d) {
				if (d.parent === focus) this.style.display = "inline";
			}).on("end", function(d) {
				if (d.parent !== focus) this.style.display = "none";
			});
		},
		focus: function focus() {
			return focus;
		},
		zoomTo: function zoomTo(v) {
			var k = diameter / v[2];
			view = v;
			node.attr("transform", function(d) {
				return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
			});
			circle.attr("r", function(d) {
				return d.r * k;
			});
			d3.selectAll("g").select(function() {
					d3.select(this).selectAll(".Noderect").style("pointer-events",
							function(d) {
								!focus.children ? "auto" : "none"
							}).style("stroke-width", function(d) {
							return d.gap != undefined ? d.gap * k : 0;
						})
						.attr("width", function(d) {
							return d.eqrectW["n" + d.id + d3.select(this).attr("id")] * k
						})
						.attr("height", function(d) {
							return d.rectH * k;
						}).attr("x", function(d) {
							return d.posX * k;
						}).attr("y", function(d) {
							return d.eqposY["n" + d.id + d3.select(this).attr("id")] * k
						});
				})
		},
		nodes: function() {
			return nodes
		},
		circles: function() {
			return circle
		}
	}
})();
var img_tree = (function() {
	var margin = {
			top: 30,
			right: 20,
			bottom: 30,
			left: 20
		},
		width = 900 - margin.left - margin.right,
		barHeight = 40,
		barWidth = width * .85;
	var imgwidth = 940;
	var duration = 00,
		root;
	var nodes;
	var nodeEnter;
	var tree = d3.tree().nodeSize([0, 20]);
	var svg = d3.select("#tree").attr("width", width + margin.left + margin.right)
		.append("g").attr("transform", "translate(" + margin.left + "," + margin.top +
			")");
	return {
		draw: function(flare, mode) {
			root = d3.hierarchy(flare).sum(function(d) {
				return d.size;
			}).sort(function(a, b) {
				return b.value - a.value;
			});
			root.i = 0;
			mode(root);
			root._descendants = root.descendants();
			root.descendants().forEach(function(d) {
				if (d.children) {
					d._children = d.children;
					d.children = null;
					d.chpivo = [];
				}
			});
			img_tree.click(root);
		},
		update: function update(source) {
			// Compute the flattened node list. TODO use d3.layout.hierarchy.
			nodes = tree(root).descendants();
			var height = Math.max(0, nodes.length * barHeight + margin.top + margin.bottom);
			d3.select("#tree").transition().duration(duration).attr("height", height);
			var l1 = [];
			if (root.children) l1.push(root);
			while (l1.length > 0) {
				var count = 1;
				var n = l1.pop();
				//n.children.forEach(function(x){console.log( x.data.name);});
				for (var i = 0; i < n.children.length; i++) {
					var c = n.children[i];
					c.i = n.i + count;
					if (c.children) {
						count = count + c.descendants().length;
						l1.push(c);
					} else {
						count = count + 1;
					};
				};
			}
			// Compute the "layout".
			nodes.forEach(function(n) {
				n.x = n.i * barHeight;
			});
			// Update the nodes…
			svg.selectAll("g.rects").remove()
			var node = svg.selectAll("g.rects").data(nodes, function(d) {
				return d.id || (d.id = ++i);
			});
			var nodeEnter = node.enter().append("g").attr("class", "rects").attr(
				"transform",
				function(d) {
					return "translate(" + source.y + "," + source.x + ")";
				}).style("opacity", 1e-6);
			// Enter any new nodes at the parent's previous position.
			nodeEnter.append("rect").attr("y", -barHeight / 2).attr("height",
				barHeight).attr("width", barWidth).style("fill", function(d) {
				return d.data.id === undefined ? d3.hcl(d.color.h, d.color.c, d.color.l) :
					null;
			}).on("click", img_tree.clickp);
			nodeEnter.append("text").attr("dy", 3.5).attr("dx", 5.5).text(function(d) { //console.log(d.data.name+"--"+d.children);
				return d.data.id === undefined ? d.data.name : d.data.name + " ( " + d
					.data.id + " ) ";
			});
			// Transition nodes to their new position.
			nodeEnter.transition().duration(duration).attr("transform", function(d) {
				return "translate(" + d.y + "," + d.x + ")";
			}).style("opacity", 1);
			node.transition().duration(duration).attr("transform", function(d) {
				return "translate(" + d.y + "," + d.x + ")";
			}).style("opacity", 1).select("rect").style("fill", function(d) {
				return d.data.id === undefined ? d3.hcl(d.color.h, d.color.c, d.color.l) :
					null;
			});
			// Transition exiting nodes to the parent's new position.
			node.exit().transition().duration(duration).attr("transform", function(d) {
				return "translate(" + source.y + "," + source.x + ")";
			}).style("opacity", 1e-6).remove();
			nodes.forEach(function(d) {
				d.x0 = d.x;
				d.y0 = d.y
			});
		},
		///////////////////////////
		update2: function update(source) {
			// Compute the flattened node list. TODO use d3.layout.hierarchy.
			//console.log("=>"+source.data.name+"<=");
			var set = new Set();
			source.forEach(function(x) {
				x.ancestors().forEach(function(y) {
					set.add(y)
				})
				if (x._children) {
					x.children = x._children
				}
			});
			//f(source.children){img_tree.unclick(x)}
			nodes = [...set];
			nodes.forEach(function(x) {
				if (x.parent) {
					//console.log(x.data.name + "--" + x.parent.data.name +"--"+ x.parent.children);
					if (x.parent.children) {
						if (!(x in x.parent.children)) {
							//
							x.parent.children.push(x);
							//console.log(x.parent.children.length)
						}
					} else {
						//console.log(x.data.name + "--" + x.parent.data.name);
						x.parent.children = [x];
					}
				}
			});
			//console.log("--------------------");
			//nodes.forEach(function(x){img_tree.update(x)})
			nodes.forEach(function(x) {
				img_tree.update(x)
			});
			//	img_tree.click(root)
			//nodes.forEach(function(x){console.log(x.data.name+"--"+x.x + "--" +x.y+"--"+ x.i)})
		},
		// Toggle children on click.
		clickp: function click(d) {
			var focus = img_bubble.focus();
			var treeI;
			var nodetree = img_bubble.nodes();
			nodetree.forEach(function(x) {
				if (x.data === d.data) {
					treeI = x;
				}
			});
			if (d.children) {
				// d._children = d.children;
				d.children = null;
				img_tree.update(d);
				if (d.parent !== null) img_bubble.zoomTree(treeI.parent, focus)
			} else {
				if (d._children) {
					d.children = d._children;
					d.children.forEach(function(x) {
						if (x.children) {
							x.children = null
						}
					});
					img_tree.update(d);
					if (focus !== treeI) {
						img_bubble.zoomTree(treeI, focus)
					} else {
						if (d.parent !== null) img_bubble.zoomTree(treeI.parent, focus)
					};
					d3.event.stopPropagation();
					if (focus === treeI) img_bubble.zoom(treeI)
				}
			}
		},
		click: function click(d) {
			if (d.children) {
				// d._children = d.children;
				d.children = null;
			} else {
				if (d._children) {
					d.children = d._children;
					d.children.forEach(function(x) {
						if (x.children) {
							x.children = null
						}
					});
				}
			}
			img_tree.update(d);
		},
		click2: function click2(d) {
			if (!d.children && d._children) {
				d.children = d._children;
			}
			img_tree.update(d);
		},
		nodes: function() {
			return nodes
		},
		nodeEnter: function() {
			return nodeEnter
		},
		root: function() {
			return root
		}
	}
})();
function ready(fn) {
	if (document.readyState !== "loading") {
		fn();
	} else {
		document.addEventListener("DOMContentLoaded", fn);
	}
}
ready(function() {
	var additive = TreeColors("add"),
		subtractive = TreeColors("sub"),
		mode = additive;
	d3.json("modulesCh.json", function(error, root) {
		if (error) throw error;
		img_bubble.draw(root, mode);
		img_tree.draw(root, mode);
	});
});
