'use strict';

function range(x) {
    return Array.apply(null, new Array(x)).map(function (_, i) {return i; });
}

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
                    svg;

                function initalizeSvg() {
                    d3.select("svg").remove();
                    return d3.select("manacher_directive").append("svg")
                        .attr("width", width)
                        .attr("height", height)
                        .append("g");
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
                        .domain(range(newStringChars.length))
                        .rangePoints(getMainExtent());

                    sidePanelX = d3.scale.ordinal()
                        .domain(range(3))
                        .rangePoints(getSidePanelExtent());

                    y = d3.scale.ordinal()
                        .domain(range(5))
                        .rangePoints(getVerticalExtent());


                    function tUpdateCB(oldT, newT) {
                        o = d3.scale.ordinal()
                            .domain(range(newT.length))
                            .rangePoints(getMainExtent());

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
                                return y(0);
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
                            .domain(range(newP.length))
                            .rangePoints(getMainExtent());
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
                                return y(1);
                            })
                            .text(function(d,i) {
                                return "+" + String(magnitudes[i]);
                            })
                            .transition()
                            .duration(500)
                            .attr("x", function (d) {
                                return o(d);
                            })
                            .attr("y", function (d, i) {
                                return y(0);
                            })
                            .style('opacity', 0);

                        return $timeout(function() {
                            svg.selectAll("text.pchange").remove();
                        }, 500);
                    }


                    function iUpdateCB(oldPos, newPos) {
                        svg.selectAll("path.i").remove();

                        svg.append("path")
                            .attr("d", d3.svg.symbol().type("triangle-up").size(triangleArea))
                            .attr("transform", function(d) { return "translate(" + (o(oldPos)) + "," + y(2) + ")"; })
                            .attr("class", "i")
                            .transition()
                            .attr("transform", function(d) { return "translate(" + (o(newPos)) + "," + y(2) + ")"; })
                            .duration(500);

                        svg.selectAll("text.i").remove();
                        svg.selectAll("text.i")
                            .data(["i=", String(newPos)])
                            .enter()
                            .append("text")
                            .attr("class", "side i")
                            .attr("x", function (d, i) {
                                return sidePanelX(i);
                            })
                            .attr("y", function (d, i) {
                                return y(2);
                            })
                            .attr("dy", ".35em")
                            .text(function (d) {
                                return String(d);
                            });

                        return $timeout(function() {}, 500);
                    }

                    function cUpdateCB(oldPos, newPos) {
                        svg.selectAll("path.c").remove();

                        svg.append("path")
                            .attr("d", d3.svg.symbol().type("triangle-up").size(triangleArea))
                            .attr("transform", function(d) { return "translate(" + (o(oldPos)) + "," + y(3) + ")"; })
                            .attr("class", "c")
                            .transition()
                            .attr("transform", function(d) { return "translate(" + (o(newPos)) + "," + y(3) + ")"; })
                            .duration(500);

                        svg.selectAll("text.c").remove();
                        svg.selectAll("text.c")
                            .data(["c=", String(newPos)])
                            .enter()
                            .append("text")
                            .attr("class", "side c")
                            .attr("x", function (d, i) {
                                return sidePanelX(i);
                            })
                            .attr("y", function (d, i) {
                                return y(3);
                            })
                            .attr("dy", ".35em")
                            .text(function (d) {
                                return String(d);
                            });


                        return $timeout(function() {}, 500);
                    }

                    function rUpdateCB(oldPos, newPos) {
                        svg.selectAll("path.r").remove();

                        svg.append("path")
                            .attr("d", d3.svg.symbol().type("triangle-up").size(triangleArea))
                            .attr("transform", function(d) { return "translate(" + (o(oldPos)) + "," + y(4) + ")"; })
                            .attr("class", "r")
                            .transition()
                            .attr("transform", function(d) { return "translate(" + (o(newPos)) + "," + y(4) + ")"; })
                            .duration(500);

                        svg.selectAll("text.r").remove();
                        svg.selectAll("text.r")
                            .data(["r=", String(newPos)])
                            .enter()
                            .append("text")
                            .attr("class", "side r")
                            .attr("x", function (d, i) {
                                return sidePanelX(i);
                            })
                            .attr("y", function (d, i) {
                                return y(4);
                            })
                            .attr("dy", ".35em")
                            .text(function (d) {
                                return String(d);
                            });

                        return $timeout(function() {}, 500);
                    }

                    function arcUpdateCB(start, end, klazz) {
                        console.log([start,end]);
                        var halfX = (o(1) - o(0)) / 2;
                        var halfY = (y(1) - y(0)) / 2;
                        var r = radiusFromSagitta(halfY, (o(end) - o(start))/2);
                        var a = angleFromSagitta(halfY, r);
                        console.log("r: " + r);
                        console.log("a: " + a);
                        var arc = d3.svg.arc()
                            .innerRadius(r)
                            .outerRadius(r + 2)
                            .startAngle(Math.PI + (a/2))
                            .endAngle(Math.PI - (a/2));

                        svg.selectAll("path." + klazz).remove();
                        svg.append("path")
                            .attr("class", klazz)
                            .attr("d", arc)
                            .attr("transform", function() {
                                return "translate(" + (o(end)+o(start))/2 + "," + (y(1)-r) + ")";
                            });


                        svg.selectAll("rect." + klazz).remove();
                        svg.selectAll("rect." + klazz)
                            .data([start,end])
                            .enter()
                            .append("rect")
                            .attr("class", klazz)
                            .attr("x", function(d) { return o(d) - halfX; })
                            .attr("y", y(0) - halfY)
                            .attr("width", halfX*2)
                            .attr("height", halfY*2);

                        return $timeout(function() {
                            svg.selectAll("path." + klazz).remove();
                            svg.selectAll("rect." + klazz).remove();
                        }, 500);
                    }

                    svg.selectAll("*").remove();
                    manacher.longestPalindrome(newString, iUpdateCB, tUpdateCB, pUpdateCB, rUpdateCB, cUpdateCB, arcUpdateCB);
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

