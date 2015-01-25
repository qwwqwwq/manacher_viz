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
                    height = 300,
                    mainMargin = 30,
                    triangleArea = 1000,
                    sidePanelWidth = 300,
                    sidePanelMargin = 30,
                    timestep = 500, // time spent rendering each algoritm step
                    svg,
                    trow = 0,
                    prow = 1,
                    irow = 2,
                    crow = 3,
                    rrow = 4,
                    initialBracket;

                function initalizeSvg() {
                    d3.select("svg").remove();
                    var svg = d3.select("manacher_directive").append("svg")
                        .attr("width", width)
                        .attr("height", height)
                        .append("g");
                    return svg;
                }

                function getMainExtent() {
                    return [0, width];
                }

                function getSidePanelExtent() {
                    return [width - sidePanelWidth + sidePanelMargin, width - sidePanelMargin];
                }

                function getVerticalExtent() {
                    return [mainMargin, height];
                }

                scope.render = function (svg, newString, oldString) {
                    if (!newString) {
                        return;
                    }
                    var newStringChars = newString.split("");
                    var o, y, sidePanelX;

                    o = d3.scale.ordinal()
                        .domain(d3.range(newStringChars.length))
                        .rangeBands(getMainExtent(), 0, 1);

                    y = d3.scale.ordinal()
                        .domain(d3.range(3))
                        .rangeBands(getVerticalExtent());


                    function tUpdateCB(oldT, newT) {
                        o = d3.scale.ordinal()
                            .domain(d3.range(newT.length))
                            .rangeBands(getMainExtent(), 0, 1);

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
                        o = d3.scale.ordinal()
                            .domain(d3.range(newP.length))
                            .rangeBands(getMainExtent(), 0, 1);
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

                            /*
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
                             */
                        };
                    }

                    function bracket (startCol, endCol, row, depth) {

                        var mid = (y(row) + y(row + 1)) / 2;

                        var start = [o(startCol) - (o.rangeBand()/2), mid];
                        var end = [o(endCol) + (o.rangeBand()/2), mid];

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
                        var defs = svg.select("defs");
                        if (defs.empty()) {
                            defs = svg.append("defs");
                        }
                        defs.append("svg:marker")
                            .attr("id", id)
                            .attr("viewBox", viewBox)
                            .attr("refX", 0)
                            .attr("refY", 0)
                            .attr("markerWidth", 6)
                            .attr("markerHeight", 6)
                            .attr("orient", "auto")
                            .append("svg:path")
                            .attr("class", klazz)
                            .attr("d", path);
                    }

                    function arrowLine (start, end, row, lineKlazz, arrowKlazz, leftArrow, rightArrow, ts) {
                        if (ts === undefined) {
                            ts = timestep;
                        }
                        var points = 50;
                        // sagitta of arc
                        var sagitta = y.rangeBand()/4;
                        if (leftArrow) {
                            arrowMarker("leftarrow", arrowKlazz, true);
                            $timeout(function() {svg.selectAll("#leftarrow").remove(); }, timestep);
                        }
                        if (rightArrow) {
                            arrowMarker("rightarrow", arrowKlazz, false);
                            $timeout(function() {svg.selectAll("#rightarrow").remove(); }, timestep);
                        }
                        var r = radiusFromSagitta(sagitta, (o(end) - o(start))/2);
                        var a = angleFromSagitta(sagitta, r);

                        var angle = d3.scale.linear()
                            .domain([0,points-1])
                            .range([Math.PI - (a/2), Math.PI + (a/2)]);

                        var line = d3.svg.line.radial()
                            .interpolate("basis")
                            .tension(0)
                            .radius(r)
                            .angle(function(d, i) { return angle(i); });

                        svg.selectAll("path." + lineKlazz).remove();
                        var radial = svg.append("path")
                            .datum(d3.range(points))
                            .attr("class", lineKlazz)
                            .attr("d", line);

                        if (leftArrow) {
                            radial = radial.attr("marker-end", "url(#leftarrow)");
                        }

                        if (rightArrow) {
                            radial = radial.attr("marker-start", "url(#rightarrow)");
                        }

                        radial.attr("transform", function() {
                                return translate((o(end)+o(start))/2, (y(row) - r) + y.rangeBand() * 0.75);
                            });

                        return $timeout(function() { svg.selectAll("path." + lineKlazz).remove(); }, timestep);
                    }

                    function arcUpdateCB(start, end, klazz) {
                        arrowLine(start, end, trow, klazz, klazz + "arrow", true, true);

                        svg.selectAll("rect." + klazz).remove();
                        svg.selectAll("rect." + klazz)
                            .data([start,end])
                            .enter()
                            .append("rect")
                            .attr("class", klazz)
                            .attr("x", function(d) { return o(d) - (o.rangeBand()/2); })
                            .attr("y", y(0) - (y.rangeBand() / 2))
                            .attr("width", o.rangeBand())
                            .attr("height", y.rangeBand());

                        if (klazz === "match") {
                            var b = bracket(start, end, trow, 10);
                            if (initialBracket === undefined) {
                                initialBracket = bracket(0, 0, trow, 10);
                            }
                            svg.selectAll("path.bracket").remove();
                            svg.append("path")
                                .attr("d", initialBracket)
                                .attr("class", "bracket")
                                .transition()
                                .duration(timestep)
                                .attr("d", b);
                            initialBracket = b;
                        }

                        return $timeout(function() {
                            svg.selectAll("rect." + klazz).remove();
                        }, timestep);
                    }

                    function endUpdateCB (start, end, newT) {
                        console.log([start, end]);
                        o = d3.scale.ordinal()
                            .domain(d3.range(newT.length))
                            .rangeBands(getMainExtent(), 0, 1);
                        var b = bracket(start, end, trow, 10);
                        if (initialBracket === undefined) {
                            initialBracket = bracket(0, 0, trow, 10);
                        }
                        svg.selectAll("path.bracket").remove();
                        svg.append("path")
                            .attr("d", initialBracket)
                            .attr("class", "bracket")
                            .transition()
                            .duration(timestep)
                            .attr("d", b);
                        initialBracket = b;

                        svg.selectAll("text.t").remove();
                        svg.selectAll("text.t")
                            .data(newT.split(""))
                            .enter()
                            .append("text")
                            .attr("class",
                            function(d, i) {
                                if( i >= start && i <= end) {
                                    return "main t hilight";
                                } else {
                                    return "main t";
                                }
                            })
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

                    function rpUpdateCB (iMirror, I, rMinusI, pIMirror) {
                        var klazz = "carry";
                        console.log("rpUpdateCB (" + iMirror + "," + I + "," + rMinusI + "," + pIMirror + ")");

                        var start, end;
                        if (pIMirror > rMinusI) {
                            start = pIMirror;
                            end = rMinusI;
                        } else if (rMinusI >= pIMirror) {
                            start = pIMirror;
                            end = pIMirror;
                        }

                        var b = svg.append("path")
                            .attr("d", bracket(iMirror - pIMirror, iMirror + pIMirror, prow, 10))
                            .attr("class", "bluebracket")
                            .transition()
                            .duration(timestep)
                            .attr("d", bracket(I - start,
                                I + start, prow, 10))
                            .transition()
                            .duration(timestep)
                            .attr("d", bracket(I - end,
                                I + end, prow, 10));


                        arrowLine(iMirror, I, prow, klazz, klazz + "arrow", false, true, timestep*2);

                        return $timeout(function() {
                            svg.selectAll("path.bluebracket").remove();
                        }, timestep*2);
                    }

                    svg.selectAll("*").remove();
                    manacher.longestPalindrome(newString,
                        tickUpdateCBFactory("i", irow),
                        tUpdateCB, pUpdateCB,
                        arcUpdateCB, rpUpdateCB, endUpdateCB);
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

