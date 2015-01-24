/**
 * Created by jeffreyquinn on 1/14/15.
 */

angular.module('manacher').factory('manacherFactory', ['$timeout', '$log', function ($timeout, $log) {
    var timestep = 500, nextTimeStep;
    var delay = 0;
    var promises = [];
    /** Transform S varo T.
     * For example, S = "abba", T = "^#a#b#b#a#$".
     * ^ and $ signs are sentinels appended to each end to avoid bounds checking
     */
    function preProcess(s) {
        var n = s.length;
        if (n === 0) {
            return "^$";
        }
        var ret = "^";
        for (var i = 0; i < n; i++)
            ret += "#" + s.substr(i, 1);

        ret += "#$";
        return ret;
    }

    function timeoutFactory(f, interval, a, b, c, d) {
        return $timeout(function() {
            f(a,b,c,d);
        }, interval);
    }

    var mod = {"longestPalindrome":
    function(s, iUpdateCB, tUpdateCB, pUpdateCB, arcUpdateCB, rpUpdateCB, endUpdateCB) {
        var oldC, oldR, oldP;
        delay = 0;
        promises.forEach($timeout.cancel);
        promises = [];
        promises.push(
            timeoutFactory(tUpdateCB, delay+=timestep, undefined, s)
            );
        var T = preProcess(s);
        promises.push(
            timeoutFactory(tUpdateCB, delay+=timestep, s, T)
            );
        var n = T.length;
        var P = Array.apply(null, new Array(n)).map(Number.prototype.valueOf,0);
        promises.push(
            timeoutFactory(pUpdateCB, delay+=timestep, undefined, P.slice(0))
            );
        var C = 0, R = 0;
        var i;
        for (i = 1; i < n - 1; i++) {
            promises.push(
                timeoutFactory(iUpdateCB, delay+=timestep,
                    Number(i - 1), Number(i))
                );
            var i_mirror = 2 * C - i; // equals to i' = C - (i-C)

            oldP = P.slice(0);

            if (R > i) {
                P[i] = Math.min(R - i, P[i_mirror]);
                if (P[i_mirror] > R - i) {
                    nextTimeStep = timestep * 2;
                } else {
                    nextTimeStep = timestep;
                }
                promises.push(
                    timeoutFactory(rpUpdateCB, delay+=timestep,
                        Number(i_mirror), Number(i), (R - i), P.slice(0)[i_mirror])
                    );
            } else {
                //something
                nextTimeStep = timestep;
            }

            promises.push(
                timeoutFactory(pUpdateCB, delay+=nextTimeStep, oldP.slice(0), P.slice(0))
            );

            // Attempt to expand palindrome centered at i
            while (T[i + 1 + P[i]] === T[i - 1 - P[i]]) {
                promises.push(
                    timeoutFactory(arcUpdateCB, delay+=timestep, (i - 1 - P[i]), (i + 1 + P[i]), "match")
                    );
                oldP = P.slice(0);
                P[i]++;
                promises.push(
                    timeoutFactory(pUpdateCB, delay+=timestep, oldP.slice(0), P.slice(0))
                    );
            }
            promises.push(
                timeoutFactory(arcUpdateCB, delay+=timestep, (i - 1 - P[i]), (i + 1 + P[i]), "mismatch")
                );

            // If palindrome centered at i expand past R,
            // adjust center based on expanded palindrome.
            if (i + P[i] > R) {
                oldC = C;
                C = i;
                oldR = R;
                R = i + P[i];
            }
        }

        // Find the maximum element in P.
        var maxLen = 0;
        var centerIndex = 0;
        for (i = 1; i < n - 1; i++) {
            if (P[i] > maxLen) {
                maxLen = P[i];
                centerIndex = i;
            }
        }
        var palinStart =  (centerIndex - 1 - maxLen) / 2;

        promises.push(
            timeoutFactory(endUpdateCB, delay+=timestep, palinStart, palinStart + maxLen - 1, s)
        );
        return s.substr((centerIndex - 1 - maxLen) / 2, maxLen);
    }};

    return mod;

}]);
