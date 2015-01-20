'use strict';

function radiusFromSagitta (s, L) {
    return ((s * s) + (L * L)) / (2 * s);
}

function angleFromSagitta (s, r) {
    return Math.acos(-1*((s/r) - 1)) * 2;
}

angular.module('d3Directives').directive(
    'manacherDirective',
    ['d3', 'manacherFactory', '$timeout', function (d3, manacher, $timeout) {
        return {
            restrict: 'EA',
            scope: true,
            link: function (scope, element, attrs) {
                var width = 1100,
                    height = 450,
                    mainMargin = 50,
                    triangleArea = 1000,
                    sidePanelWidth = 300,
                    sidePanelMargin = 30,
                    timestep = 500, // time spent rendering each algoritm step
                    svg,
                    trow = 0,
                    prow = 1,
                    irow = 2,
                    crow = 3,
                    rrow = 4;

                function initalizeSvg() {
                    d3.select("svg").remove();
                    var svg = d3.select("manacher_directive").append("svg")
                        .attr("width", width)
                        .attr("height", height)
                        .append("g");
                    return svg;
                }

                function getMainExtent() {
                    return [mainMargin, width - (mainMargin + sidePanelWidth)];
                }

                function getSidePanelExtent() {
                    return [width - sidePanelWidth + sidePanelMargin, width - sidePanelMargin];
                }

                function getVerticalExtent() {
                    return [mainMargin, height - mainMargin];
                }

                scope.render = function (svg, newString, oldString) {
                    if (!newString) {
                        return;
                    }
                    var newStringChars = newString.split("");
                    var o, y, sidePanelX;

                    o = d3.scale.ordinal()
                        .domain(d3.range(newStringChars.length))
                        .rangeBands(getMainExtent());

                    sidePanelX = d3.scale.ordinal()
                        .domain(d3.range(3))
                        .rangeBands(getSidePanelExtent());

                    y = d3.scale.ordinal()
                        .domain(d3.range(5))
                        .rangeBands(getVerticalExtent());


                    function tUpdateCB(oldT, newT) {
                        o = d3.scale.ordinal()
                            .domain(d3.range(newT.length))
                            .rangeBands(getMainExtent());

                        svg.selectAll("text.t").remove();

                        svg.selectAll("text.t")
                            .data(newT.split(""))
                            .enter()
                            .append("text")
                            .attr("class", "main t")
                            .attr("x", function (d, i) {
                                return o(i);
                            })
                            .attr("y", function (d, i) {
                                return y(trow);
                            })
                            .attr("dy", ".35em")
                            .text(function (d) {
                                return d;
                            });
                    }

                    function pUpdateCB(oldP, newP) {
                        var i, diffs = [], magnitudes = [];
                        // Figure out which numbers changed.
                        if (oldP && newP && oldP.length === newP.length) {
                            for (i = 0; i < oldP.length; i++) {
                                if (oldP[i] !== newP[i]) {
                                    diffs.push(i);
                                    magnitudes.push(newP[i] - oldP[i]);
                                }
                            }
                        }
                        console.log(diffs);
                        o = d3.scale.ordinal()
                            .domain(d3.range(newP.length))
                            .rangeBands(getMainExtent());
                        svg.selectAll("text.p").remove();

                        svg.selectAll("text.p")
                            .data(newP)
                            .enter()
                            .append("text")
                            .attr("class", function(d, i) {
                                var klazz = "main p";
                                if (diffs.indexOf(i) > -1) {
                                    klazz += " hilight"
                                }
                                return klazz;
                            })
                            .attr("x", function (d, i) {
                                return o(i);
                            })
                            .attr("y", function (d, i) {
                                return y(1);
                            })
                            .attr("dy", ".35em")
                            .text(function (d) {
                                return String(d);
                            });


                        svg.selectAll("text.pchange")
                            .data(diffs)
                            .enter()
                            .append("text")
                            .attr("class", "pchange main")
                            .attr("x", function (d) {
                                return o(d);
                            })
                            .attr("y", function (d, i) {
                                return y(prow);
                            })
                            .text(function(d,i) {
                                return "+" + String(magnitudes[i]);
                            })
                            .transition()
                            .duration(timestep)
                            .attr("x", function (d) {
                                return o(d);
                            })
                            .attr("y", function (d, i) {
                                return y(trow);
                            })
                            .style('opacity', 0);

                        return $timeout(function() {
                            svg.selectAll("text.pchange").remove();
                        }, timestep);
                    }

                    function translate (x, y) {
                        return "translate(" + x + "," + y + ")";
                    }

                    function tickUpdateCBFactory(klazz, row) {
                        return function (oldPos, newPos) {
                            svg.selectAll("path." + klazz).remove();

                            svg.append("path")
                                .attr("d", d3.svg.symbol().type("triangle-up").size(triangleArea))
                                .attr("transform", function () {
                                    return translate(o(oldPos), y(row));
                                })
                                .attr("class", klazz)
                                .transition()
                                .attr("transform", function () {
                                    return translate(o(newPos), y(row));
                                })
                                .duration(timestep);

                            svg.selectAll("text." + klazz).remove();
                            svg.selectAll("text." + klazz)
                                .data([klazz+"=", String(newPos)])
                                .enter()
                                .append("text")
                                .attr("class", "side " + klazz)
                                .attr("x", function (d, i) {
                                    return sidePanelX(i);
                                })
                                .attr("y", function () {
                                    return y(row);
                                })
                                .attr("dy", ".35em")
                                .text(function (d) {
                                    return String(d);
                                });
                        };
                    }

                    function bracket (start, end, depth) {
                        //The data for our line
                        var lineData = [ { "x": start[0],   "y": start[1]},  { "x": start[0],  "y": start[1]+depth},
                                         { "x": end[0],  "y": end[1]+depth}, { "x": end[0],  "y": end[1]}];

                        //This is the accessor function we talked about above
                        var lineFunction = d3.svg.line()
                                                 .x(function(d) { return d.x; })
                                                 .y(function(d) { return d.y; })
                                                 .interpolate("linear");
                        return lineFunction(lineData);
                    }

                    function arrowMarker (id, klazz, reverse) {
                        var path, viewBox;
                        if (reverse) {
                            viewBox = "-10 -5 10 10";
                            path = "M-10,-5L0,0L-10,5";
                        } else {
                            viewBox = "0 -5 10 10";
                            path = "M10,-5L0,0L10,5";
                        }
                        svg.append("defs").append("marker")
                            .attr("id", id)
                            .attr("viewBox", viewBox)
                            .attr("refX", 0)
                            .attr("refY", 0)
                            .attr("markerWidth", 6)
                            .attr("markerHeight", 6)
                            .attr("orient", "auto")
                            .attr("class", klazz)
                            .append("path")
                            .attr("d", path);
                    }

                    function arrowLine (start, end, klazz, leftArrow, rightArrow) {
                        var points = 50;
                        if (leftArrow) {
                            arrowMarker("leftarrow", klazz, true);
                            $timeout(function() {svg.selectAll("#leftarrow").remove(); }, timestep);
                        }
                        if (rightArrow) {
                            arrowMarker("rightarrow", klazz, true);
                            $timeout(function() {svg.selectAll("#rightarrow").remove(); }, timestep);
                        }
                        var r = radiusFromSagitta(quarterY, (o(end) - o(start))/2);
                        var a = angleFromSagitta(quarterY, r);

                        var angle = d3.scale.linear()
                            .domain([0,points-1])
                            .range([Math.PI - (a/2), Math.PI + (a/2)]);

                        var line = d3.svg.line.radial()
                            .interpolate("basis")
                            .tension(0)
                            .radius(r)
                            .angle(function(d, i) { return angle(i); });

                        svg.selectAll("path." + klazz).remove();
                        var radial = svg.append("path")
                            .datum(d3.range(points))
                            .attr("class", klazz + "line")
                            .attr("d", line);

                        if (leftArrow) {
                            radial = radial.attr("marker-end", "url(#arrowheadrev)");
                        }

                        if (rightArrow) {
                            radial = radial attr("marker-start", "url(#arrowheadrev)");
                        };

                        radial.attr("transform", function() {
                                return "translate(" + (o(end)+o(start))/2 + "," + (y(0)+halfY+quarterY-r) + ")";
                            });



                    }

                    function arcUpdateCB(start, end, klazz) {

                        var halfX = (o(1) - o(0)) / 2;
                        var halfY = (y(1) - y(0)) / 2;
                        var quarterY = (y(1) - y(0)) / 4;
                        var r = radiusFromSagitta(quarterY, (o(end) - o(start))/2);
                        var a = angleFromSagitta(quarterY, r);
                        var points = 50;
                        var angle = d3.scale.linear()
                            .domain([0,points-1])
                            .range([Math.PI - (a/2), Math.PI + (a/2)]);

                        var line = d3.svg.line.radial()
                            .interpolate("basis")
                            .tension(0)
                            .radius(r)
                            .angle(function(d, i) { return angle(i); });

                        svg.selectAll("path." + klazz).remove();
                        svg.append("path")
                            .datum(d3.range(points))
                            .attr("class", klazz + "line")
                            .attr("d", line)
                            .attr("marker-end", "url(#arrowhead)")
                            .attr("marker-start", "url(#arrowheadrev)")
                            .attr("transform", function() {
                                return "translate(" + (o(end)+o(start))/2 + "," + (y(0)+halfY+quarterY-r) + ")";
                            });

                        svg.selectAll("rect." + klazz).remove();
                        svg.selectAll("rect." + klazz)
                            .data([start,end])
                            .enter()
                            .append("rect")
                            .attr("class", klazz + "rect")
                            .attr("x", function(d) { return o(d) - halfX; })
                            .attr("y", y(0) - halfY)
                            .attr("width", halfX*2)
                            .attr("height", halfY*2);
                        if (klazz === "match") {
                            var mid = (y(0) + y(1)) / 2;
                            var b = bracket([o(start) - halfX, mid],
                                [(o(end) + halfX), mid],
                                10);
                            svg.selectAll("path.bracket").remove();
                            svg.append("path")
                                .attr("d", b)
                                .attr("class", "bracket");
                        }

                        return $timeout(function() {
                            svg.selectAll("path." + klazz + "line").remove();
                            svg.selectAll("rect." + klazz + "rect").remove();
                        }, 500);
                    }

                    function rpUpdateCB (iMirror, I, rMinusI, pIMirror) {
                        var klazz = "carry";
                        svg.selectAll("#carryarrowhead").remove();
                        // define the arrowhead shape for later use
                        svg.append("defs").append("marker")
                            .attr("id", "carryarrowhead")
                            .attr("viewBox", "-10 -5 10 10")
                            .attr("refX", 0)
                            .attr("refY", 0)
                            .attr("markerWidth", 6)
                            .attr("markerHeight", 6)
                            .attr("orient", "auto")
                            .attr("class", klazz+"rect")
                            .append("path")
                            .attr("d", "M10,-5L0,0L10,5");
                        var halfX = (o(1) - o(0)) / 2;
                        var halfY = (y(1) - y(0)) / 2;
                        var quarterY = (y(1) - y(0)) / 4;
                        var r = radiusFromSagitta(quarterY, (o(I) - o(iMirror))/2);
                        console.log("R: " + r);
                        var a = angleFromSagitta(quarterY, r);
                        console.log("A: " + a);
                        console.log("from: " + I + " " + iMirror);
                        var points = 50;
                        var angle = d3.scale.linear()
                            .domain([0,points-1])
                            .range([Math.PI - (a/2), Math.PI + (a/2)]);

                        var line = d3.svg.line.radial()
                            .interpolate("basis")
                            .tension(0)
                            .radius(r)
                            .angle(function(d, i) { return angle(i); });

                        svg.append("path")
                            .datum(d3.range(points))
                            .attr("class", klazz + "line")
                            .attr("d", line)
                            .attr("marker-start", "url(#carryarrowhead)")
                            .attr("transform", function() {
                                return "translate(" + (o(I)+o(iMirror))/2 + "," + (y(1)+halfY+quarterY-r) + ")";
                            });

                        return $timeout(function() {
                            svg.selectAll("path." + klazz + "line").remove();
                            svg.selectAll("rect." + klazz + "rect").remove();
                        }, 500);
                    }

                    svg.selectAll("*").remove();
                    manacher.longestPalindrome(newString,
                        tickUpdateCBFactory("i", 2),
                        tUpdateCB, pUpdateCB,
                        tickUpdateCBFactory("r", 4),
                        tickUpdateCBFactory("c", 3),
                        arcUpdateCB, rpUpdateCB);
                };

                scope.$watch(attrs.binding, function (newVals, oldVals) {
                    if (svg === undefined) {
                        svg = initalizeSvg();
                    }
                    return scope.render(svg, newVals, oldVals);
                }, true);
            }
        };
    }]
);

