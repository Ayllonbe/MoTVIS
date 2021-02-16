// GLOBAL VARIABLES
var margin = 350,
    circulardiv = document.getElementById("circular"),
    treediv = document.getElementById("treeHIDDEN"),
    canvas = d3.select("#circular").append("canvas")
            .attr("width",circulardiv.clientWidth)
            .attr("height",circulardiv.clientHeight),
    canvasTree = d3.select("#tree").append("canvas")
                .attr("width",treediv.clientWidth)
                .attr("height",treediv.clientHeight),
    context = canvas.node().getContext("2d"),
    contextTree = canvasTree.node().getContext("2d"),

    width = circulardiv.clientWidth,
    height = circulardiv.clientHeight,
    widthTREE = treediv.clientWidth,
    heightTREE = treediv.clientHeight,
    focus,
    focus0,
    mousefocus,
    view,
    scale,
    count = 0,
    interval,
    pvMin = [],
    transform = d3.zoomIdentity,
    x,
    y,
    pack = d3.pack().size([width-margin, height-margin]),
    additive = TreeColors("add"),
    subtractive = TreeColors("sub"),
    mode = additive;

d3.json("results/GeneWise/modules.json", function(error, root) {  if (error) throw error;
//d3.json("results/modules.json", function(error, root) {  if (error) throw error;

  // Init root node.
  root = d3.hierarchy(root).sum(function(d) {
    return d.size; // Addition of size from leaves to root.
  }) // somme dès le leaves jusqua le root
    .sort(function(a, b) {
      return b.value - a.value;
    });
  mode(root); // Take color from TreeColors.js

  //LOCAL VARIABLES
  var circles = pack(root).descendants(),
   circleLeaf = pack(root).leaves(),
  str2obj = {},
  equalDic = {},
  Maxv,
  circleHIDDEN,
  barH;

/*
  var test = [];
  var countleaf =0;
  const set1 = new Set();
  circles.forEach(function(d){
test.push(d.value);
if(!d.children){
  countleaf = countleaf+1;
  set1.add(d.data.id);
}

  })
console.log(set1)
  console.log("Nodes : " + circles.length + " leafs : "+countleaf + " modules : "+set1.size);
*/
 //console.log(test);
  //console.log(Math.max(test) + " " + Math.min(test));
  /*
  PREPARE THE CIRCLES ASSOCIATING THE WIDTH AND HEIGHT FOR COLLAPSIBLE INDENTED
  TREE. ALSO THERE ARE
  */

var t =  new Set();

  circles.forEach(function(d) {

    d.wTree = treediv.clientWidth/1.1;
    d.hTree = 30;
    //str2obj[d.data.name] = d;
    if(!d.children && d.data.pvalue!=undefined){
      t.add(d.parent.data.name);
      // undefined IS BECAUSE THERE ARE LEAVE IN NO ASSOCIATED GO TERM WITHOUT pvalue
      pvMin.push(-Math.log(d.data.pvalue));
      str2obj[d.data.name+"-"+d.data.id] = d;
      //THAT IS TO DETECT THE PARENT NODE. REDUCE THE SIZE IN ONE IS NOT SIGNIFICATIVE
      if(d.parent.r===d.r){
        d.r=d.r *0.9;
        d.wTree = d.wTree * 0.9;
      }
    }
  });

   console.log(t.size);
   console.log(circles.length);
  circleLeaf.forEach(function(d) {
    d.equalCircle = [];
    //console.log(d.data.name);
    Object.keys(d.data.dic).forEach(function(b) {
      if(str2obj[b+"-"+d.data.id]!=undefined){
            d.equalCircle.push(str2obj[b+"-"+d.data.id]);
          }

    });
  });


  /*
  Maxv IS THE MAXIMUN pvalue IN ALL LEAVES NODES WITH pvalues
  */
  Maxv = Math.max.apply(Math, pvMin.map(function(o) {
  				return o;
  			}));

  /*
  PREPARING THE FIRST RENDERING. x and y show the original position.
  */
  x = root.x+margin/2;
  y = root.y+margin/2;
  root.__children =root.children;
  root.xTree = 5;
  root.yTree = 5;
  circleHIDDEN = [];
  barH = root.__children.length + 1; // +1 CONSIDER THE ROOT
  focus = root;
  focus0 = root;
  view = [root.x, root.y, root.r * 2];
  /*
  BEGING THE FIRST RENDERING
  */
  render(view);
  textNode(root,1.0);
  renderTREE(root,0);
  /*
  FUNCTIONALITIES WITH MOUSE
  */
  canvasTree.on("click", clickTree);
  canvas.on("mousemove", mouseAbove);
  canvas.on('click', clicked);
  canvas.on('dblclick',function(){
            focus = root;
            view = [root.x, root.y, root.r * 2];
            render(view);
            textNode(root,1.0);

            contextTree.clearRect(0, 0, widthTREE,  heightTREE);
            canvasTree.attr("height", treediv.clientHeight);
            heightTREE = treediv.clientHeight;
          //  console.log( treediv.clientHeight);
            root.children.forEach(function(c){
              close(c);
            })
            root.__children = root.children;
            barH = root.__children.length + 1;
            count = 0;
            renderTREE(root,0);
          //  console.log(root.__children);

          });
  /*
  THIS FUNCTION PROVIDE RENDERING IN BUBBLE PACKING (CIRCULAR TREEMAP)
  */

  function render(v) {
    context.clearRect(0, 0, width, height); // CLEAR canvas.
    scale = (width-margin) / v[2];
    //console.log("scale "+scale);
    view = v;
    for (var i = 0, n = circles.length, circle; i < n; ++i) {
      circle = circles[i];
      var circleX = ((circle.x-v[0])*scale)+x,
      circleY = ((circle.y-v[1])*scale)+y;
      if(circle.r<0){
      //  console.log(circle.r);
        circle.r = circle.r *(-1);
        //console.log(circle.r);
      }
      var circleR = circle.r*scale;
      context.beginPath();
      if(circle.children){
        /*
        DRAW THE NON-LEAVES CIRCLE
        */

        context.moveTo(circleX + circleR, circleY);
        context.arc(circleX,circleY,circleR, 0, 2 * Math.PI);
        context.fillStyle =  d3.hcl(circle.color.h, circle.color.c, circle.color.l);
        context.fill();
      }
      else{
        /*
        DRAW THE LEAVES CIRCLE
        */
        context.moveTo(circleX + circleR, circleY );
      //  console.log(circle);
      //  console.log(circleX + " " +circleY + " "+ circleR + " " + circle.r + " " + scale);
    //  console.log(circle);
      //console.log(circleR +" " + circleX +" "+ circleY);
        context.arc(circleX,circleY,circleR, 0, 2 * Math.PI);
        context.fillStyle =  d3.rgb(255,255,255);
        context.fill();
        /*
        DRAW THE BAR CHART INTO LEAVES CIRCLE
        */
        if(circle.data.dic != undefined){


          circle.rectH = ((circleR * Math.pow(2, 1 / 2)) / 2) / circle.equalCircle.length;
          circle.posX = circleX - circleR / 2;//(Math.pow(2, 1 / 2));
          circle.posY = circleY- circle.equalCircle.length * circle.rectH / 2
          circle.gap = circle.rectH * 0.1;
          circle.equalCircle.sort(function(obj1,obj2){
            return obj1.data.pvalue - obj2.data.pvalue;
          });
          circle.axisY = circle.posY + circle.rectH * (circle.equalCircle.length);
          circle.axisWitdh = (circleR* Maxv) /  Maxv;
          circle.eqobjs = [];
          circle.equalCircle.forEach(function(obj,i){
            var posY = circle.posY + circle.rectH * i // Y position
            var posW =(obj.r*scale * -Math.log(obj.data.pvalue)) /  Maxv; // WIDTH
            context.fillStyle=d3.hcl(obj.color.h, obj.color.c, obj.color.l);
            context.fillRect(circle.posX,posY,posW,circle.rectH-circle.gap);
            /*
            circle.equalCircle IS A VARIABLE TO OBJ circle USED AFTER IN LEAVE ZOOM
            SHOWING THE TOOLTIP ONLY IN THE RECTANGLE.
            */
            var eqobj = {};
            eqobj.data = {};
            eqobj.color = obj.color;
            eqobj.data.name = obj.data.name;
            eqobj.data.pvalue = obj.data.pvalue;
            eqobj.x = circle.posX;
            eqobj.y = posY;
            eqobj.w = posW;
            eqobj.h = circle.rectH-circle.gap;
            circle.eqobjs.push(eqobj);
            });
          };
        }

    /*  if (circle.active) {
      context.lineWidth = 0;
      context.strokeStyle = "null";
      context.stroke();
    }*/
    };

    };
  /*
  THIS FUNCTION PROVIDE ZOOM IN THE CIRCLE NODE CLICKED
  */

  function zoomClick(d) {
		focus0 = focus;
		focus = d;
    /*
    FIRST TRANSTITION TO CREATE THE ZOOM IN THE NODE
    */
		var transition = d3.transition()
				.duration(d3.event.altKey ? 7500 : 750)
				.tween("zoom", function(d) {
						var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
						return function(t) {
						 render(i(t));
            };
				});
        /*
        SECOND TRANSTITION TO CREATE THE TEXT IN THAT DEPTH
        */




    transition.transition().duration(d3.event.altKey ? 7500 : 2750).tween("fill", function() {
      var imgData = context.getImageData(0,0, width, height);
      console.log(imgData)
        var alpha = 0;
         interval = setInterval(function(){
          //render([focus.x, focus.y, focus.r * 2]);
          alpha = Math.min(alpha +0.2, 1);
          context.clearRect(0, 0, width, height); // CLEAR canvas.
          context.putImageData(imgData,0, 0 );
          //render([focus.x, focus.y, focus.r * 2]);
          textNode(focus,alpha);
          if(alpha===1){
            clearInterval(interval);
          }
        },50)
      });

    };
    /*
    FUNCTION TO WIRTE TEXT ON/IN CIRCLE.
    */
  function textNode(focus,opacity){
    var listNode = [];
    /*
    * Write text to focus and his children
    */
    if(focus.children){
      listNode = listNode.concat(focus.children);
      if(focus.data.name!==root.data.name){
        listNode.push(focus);
      };
      listNode.forEach(function(circle){
        var circleX = ((circle.x-focus.x)*scale)+x,
        circleY = ((circle.y-focus.y)*scale)+y,
        circleR = circle.r*scale;
        if(circle.children){
          drawTextAlongArc(context,circle.data.name, circleX, circleY,circleR,opacity);
        }
        else{
         var font = circleR*0.08;
         context.font = font + 'pt Arial';
         context.fillStyle = "rgba(0, 0, 0," +opacity+")";
         context.fillText(circle.data.id, circleX-context.measureText(circle.data.id).width/2, circleY-circleR/1.5);
       }
      });
    }
    /*
    * Write Text only when zoom in node leave
    */

    else{

     var circleX = ((focus.x-focus.x)*scale)+x,
     circleY = ((focus.y-focus.y)*scale)+y,
     circleR = focus.r*scale,
     font = circleR*0.08;
     context.font = font + 'pt Arial';
     context.fillStyle = "rgba(0, 0, 0," +opacity+")";
    // console.log(font)
     context.fillText(focus.data.id, circleX-context.measureText(focus.data.id).width/2, circleY-circleR/1.5);
     font = circleR*0.06;
     context.font = 'italic '+ font + 'pt Arial';
     while(context.measureText(focus.data.name).width>(Math.sqrt(3)*circleR)){
       font = font -3;
       context.font = 'italic '+ font + 'pt Arial';
     }
     context.fillStyle = 'rgba(192,192,192,'+ opacity+ ')';
     context.fillText(focus.data.name, circleX-context.measureText(focus.data.name).width/2, circleY-circleR/2);
     context.fillStyle="black";
     context.fillRect(focus.posX,focus.axisY,focus.axisWitdh,3);
     context.font = 'italic '+ font/2 + 'pt Arial';
     context.fillStyle = "black";
     context.fillText("0", focus.posX,focus.axisY+font/1.5);
     context.fillStyle = "black";
     var number = Math.trunc(Maxv)+1;
     number = number.toString()
     context.fillText(number, focus.posX+focus.axisWitdh-context.measureText(number).width,focus.axisY + font/1.5);
     var pvaluestr = "-log(pvalue)"
     context.fillText(pvaluestr, focus.posX-context.measureText(pvaluestr).width/2+focus.axisWitdh/2,focus.axisY+font);
      };
  }
  /*
  TO FIND THE CIRCLE
  */
  function clicked() {
    var point = d3.mouse(this);
    	var node;
    	var minDepth = -Infinity;
    	circles.forEach(function(d) {
    		var dx = ((d.x-view[0])*scale)+x - point[0];
    		var dy = ((d.y-view[1])*scale)+y - point[1];
    		var distance = Math.sqrt((dx * dx) + (dy * dy));
    		if (d.depth >minDepth && distance < d.r*scale) {
    			minDistance = d.depth;
    			node = d;
    		}
    	});
      if(node) {
  					if (focus !== node){
               zoomClick(node);
               developpeTree(node);
             }
            else {
              zoomClick(node.parent);
              developpeTree(node.parent);
            }
  				}
    }
  /*
  TOOLTIP CREATION (TAKE IN INTERNET AND MODIFIED).
  */
  function mouseAbove() {
    	var point = d3.mouse(this);
    	var node;
    	var minDepth = -Infinity;
    	circles.forEach(function(d) {
    		var dx = ((d.x-view[0])*scale)+x - point[0];
    		var dy = ((d.y-view[1])*scale)+y - point[1];
    		var distance = Math.sqrt((dx * dx) + (dy * dy));
    		if (d.depth >minDepth && distance < d.r*scale) {
    			minDistance = d.depth;
    			node = d;
    		}
    	});
      if(node && focus.children) {
        if(node.children){
        d3.select('#tooltip')
  					.style('opacity', 0.8)
  					.style('top', d3.event.pageY -100 + 'px')
  					.style('left', d3.event.pageX -50 + 'px')
  					.html("Term name: "+node.data.name);}
            else{
              d3.select('#tooltip')
        					.style('opacity', 0.8)
        					.style('top', d3.event.pageY -100 + 'px')
        					.style('left', d3.event.pageX -50 + 'px')
        					.html("ID: "+node.data.id+"</br>Term name: "+node.data.name);
            }
  					//if (focus !== node) {mousefocus = node;} else if(node!==root){mousefocus = node.parent;};
  				}else if(node && !focus.children){
  				// Hide the tooltip when there our mouse doesn't find nodeData
            var rectnode;
            focus.eqobjs.forEach(function(d){
            d3.select('#tooltip')
              .style('opacity', 0);
              //console.log(d.name +" "+d.x + " "+ d.y + " " +d.w +" "+d.h +" "+(d.x + d.w)+ " " +(d.y+d.h));
            if(d.x<point[0]&& point[0]<(d.x+d.w) && d.y<point[1] && point[1]<(d.y+d.h)){

              rectnode = d;
            }
          });
          if(rectnode){
            d3.select('#tooltip')
                .style('opacity', 0.8)
                .style('top', d3.event.pageY - 100 + 'px')
                .style('left', d3.event.pageX - 50 + 'px')
                .html("Term name: "+rectnode.data.name+"</br>pvalue: "+rectnode.data.pvalue);
          }else{
            d3.select('#tooltip')
              .style('opacity', 0);
          }

  			}
        else if(node===undefined){
          d3.select('#tooltip')
            .style('opacity', 0);
        }
  };


  ///tree
  function renderTREE(d,xTree) {
    circleHIDDEN.push(d);
    if(d.data.id){
      var font = 16,
      text =d.data.id +" - " + d.data.name;
      contextTree.fillStyle = "white";
      contextTree.strokeStyle = d3.hcl(d.color.h, d.color.c, d.color.l);
      contextTree.strokeRect(d.xTree,d.yTree,d.wTree,d.hTree);
      contextTree.fillStyle = "black";
      contextTree.font = font+"pt Arial";
      //console.log(contextTree.measureText(d.data.id).width +"  " + d.wTree);
      while(contextTree.measureText(text).width>d.wTree){
          font = font -1;
          contextTree.font =  font + 'pt Arial';
        };
      contextTree.fillText(text, d.xTree+5, d.yTree+23);
     }
    else{
      var fontTREE = 16;
      contextTree.fillStyle = d3.hcl(d.color.h, d.color.c, d.color.l);
      contextTree.fillRect(d.xTree,d.yTree,d.wTree,d.hTree);
      contextTree.fillStyle = "white";
      contextTree.font = fontTREE+"pt Arial";
      while(contextTree.measureText(d.data.name).width>d.wTree){
          fontTREE = fontTREE -1;
          contextTree.font =  fontTREE + 'pt Arial';
        };
      contextTree.fillText(d.data.name, d.xTree+5, d.yTree+23);

    };
    count = count + 1;
    if(d.__children){
      xTree = xTree + 10;//* (d.depth+1);
      d.__children.sort(function(a, b){
        if(a.data.name < b.data.name) return 1;
        if(a.data.name > b.data.name) return -1;
        return 0;
      })
      d.__children.forEach(function(c){
        c.xTree = root.xTree + 10*c.depth;
        c.yTree = root.yTree + count*d.hTree;
        renderTREE(c,xTree);
      });
    };
  };
  /*
  CLICK NODE IN THE TREE
  */
  function clickTree(){
    var pointTREE = d3.mouse(this);
    var rectnode;
    // Recover the clicked rectangle.
    circleHIDDEN.forEach(function(d){
      if(d.xTree<pointTREE[0]&& pointTREE[0]<(d.xTree+d.wTree) && d.yTree<pointTREE[1] && pointTREE[1]<(d.yTree+d.hTree)){
        rectnode = d;
      };
     });
    if(rectnode!==root && rectnode!==undefined) {
      if (focus !== rectnode){
         zoomClick(rectnode);
         developpeTree(rectnode);
       }
      else {
        zoomClick(rectnode.parent);
        developpeTree(rectnode.parent);
      };
    };
  };
  /*
  FUNCTION TO OPEN OR CLOSE NODE IN TREE
  */
  function developpeTree(rectnode){
    if(!rectnode.children){
      root.descendants().forEach(function(c){

        close(c);
      })
    barH = 1;
    var equalRect = [];
    Object.keys(rectnode.data.dic).forEach(function(b) {
        if(str2obj[b+"-"+rectnode.data.id]){
          if(str2obj[b+"-"+rectnode.data.id].data.pvalue){
            equalRect.push(str2obj[b+"-"+rectnode.data.id]);
          };

        };
      });
      equalRect.forEach(function(c){
        barH = barH +1
        openLeave(c);
      })
    }
    else{
      barH = 1.5;// 0.5 TO HAVE A LITTLE SPACE IN THE END OF VISU.
      if(!focus0.children){
        root.descendants().forEach(function(c){
          if(focus0.ancestors().includes(c) || rectnode === c){
            open(c);
            if(c.children){
              barH = barH + c.__children.length;
            };
          }
          else{
            close(c);
          };
        })
      }else{
        root.descendants().forEach(function(c){
          if(rectnode.ancestors().includes(c) || rectnode === c){
            open(c);
            if(c.children){
              barH = barH + c.__children.length;
            };
          }
          else{
            close(c);
          };
        });
      };

    };
  /*
  PREPARING TO RENDERING
  */
  count = 0;
  if(treediv.clientHeight < (root.yTree + barH*30)){
    contextTree.clearRect(0, 0, widthTREE,  heightTREE);
    canvasTree.attr("height", root.yTree + barH*30);
    heightTREE = root.yTree + barH*30
  }
  else{
    contextTree.clearRect(0, 0, widthTREE,  heightTREE);
    canvasTree.attr("height", treediv.clientHeight);
    heightTREE = treediv.clientHeight;
  };

  renderTREE(root,0);

};
    /*
    FUNCTION TO DEVELOPPE THE PLACE WHERE A LEAVE IS REPEAT.
    */
  function openLeave(d){

    if(d.parent){
    if(d.parent.__children&&!d.parent.__children.includes(d)){
      d.parent.__children.push(d);
    }else if(!d.parent.__children){
      barH = barH+1;
      d.parent.__children = [d];
    }
    if(d.parent.parent){
      openLeave(d.parent);
    }}
  }

  function open(d){
    d.__children = d.children;
  }
  function close(d){
    d.__children = null;

  };


});
/*
DRAW ARC ON CIRCLE (TAKE FFROM INTERNET AND MODIFIED)
*/
function drawTextAlongArc(context,str, centerX, centerY, radius,alpha){

                var font = radius*0.08;
                context.save();
                context.font = 'bold '+font + 'pt Ubuntu Mono';
              /*  while(contextTree.measureText(str).width>radius*(2+Math.PI)){
                  font = font -1;
                  contextTree.font =  font + 'pt Arial';
                }*/
                var angle =  (Math.PI*(context.measureText(str).width)/radius)/2;

            //      console.log(str + '  ' +font + '  ' + angle);

                while(angle>Math.PI){
                  font = (font*Math.PI)/angle;
                  context.font =  'bold '+font + 'pt Ubuntu Mono';
                    angle =  (Math.PI*(context.measureText(str).width)/radius)/2;

                }
                context.translate(centerX, centerY);
                context.rotate(-1 * angle / 2);
                context.rotate(-1 * (angle / str.length) / 2);
                for (var n = 0; n < str.length; n++) {
                    context.rotate(angle / str.length);
                    context.save();
                    context.translate(0, -1 * radius);
                    var char = str[n];
                    context.strokeStyle= "rgba(0,0,0, " + alpha + ")";
                    context.fillStyle = "rgba(0, 0, 0, " + alpha + ")";
                    context.fillText(char, 0, 0);
                    context.strokeText(char, 0, 0);
                    context.restore();
                }
               context.restore();
}
