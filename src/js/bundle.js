// TODO: Discuss reconciling this with the docpad and fluid-sandbox approaches and generalising for reuse.
/* eslint-env node */
"use strict";
var fluid = require("infusion");
fluid.setLogging(true);

var gpii = fluid.registerNamespace("gpii");

var copy   = require("recursive-copy");
var fs     = require("fs");
var mkdirp = require("mkdirp");
var path   = require("path");
var rimraf = require("rimraf");

fluid.registerNamespace("gpii.schema.demo.generator");

require("../../index.js");

gpii.schema.demo.generator.makeBundle = function (that) {
    var resolvedBasePath = fluid.module.resolvePath(that.options.baseDir);
    var resolvedOutputDir = fluid.module.resolvePath(that.options.targetDir);
    var promises = [];

    if (fs.existsSync(resolvedOutputDir)) {
        promises.push(function () {
            var removeExistingPromise = fluid.promise();

            rimraf(resolvedOutputDir, function (error) {
                if (error) {
                    removeExistingPromise.reject(error);
                }
                else {
                    removeExistingPromise.resolve("Existing content removed.");
                }
            });
            return removeExistingPromise;
        });
    }

    promises.push(function () {
        var createDirPromise = fluid.promise();

        mkdirp(resolvedOutputDir, function (error) {
            if (error) {
                createDirPromise.reject(error);
            }
            else {
                createDirPromise.resolve("Output directory created.");
            }
        });

        return createDirPromise;
    });

    fluid.each(fluid.makeArray(that.options.bundle), function (singleItemPath) {
        var itemSrcPath = path.resolve(resolvedBasePath, singleItemPath);
        var itemDestPath = path.resolve(resolvedOutputDir, singleItemPath);

        // Return a promise-returning function so that only one call will be in flight at a time.
        promises.push(function () {
            return copy(itemSrcPath, itemDestPath);
        });
    });

    var sequence = fluid.promise.sequence(promises);

    sequence.then(
        function () { fluid.log("Finished, bundled output saved to '", resolvedOutputDir, "'..."); },
        fluid.fail
    );

    return sequence;
};

fluid.defaults("gpii.schema.demo.generator", {
    gradeNames: ["fluid.component"],
    baseDir: "%gss-live-demo",
    targetDir: "%gss-live-demo/generated",
    bundle: [
        "./index.html",
        "./node_modules/ajv/dist/ajv.bundle.js",
        "./node_modules/foundation-sites/dist/css/foundation.css",
        "./node_modules/infusion/dist/infusion-all.js",
        "./node_modules/infusion/dist/infusion-all.js.map",
        "./node_modules/gpii-binder/src/js/binder.js",
        "./node_modules/gpii-json-schema/src/js/common/gss-metaschema.js",
        "./node_modules/gpii-json-schema/src/js/common/validation-errors.js",
        "./node_modules/gpii-json-schema/src/js/common/validator.js",
        "./node_modules/gpii-json-schema/src/js/common/schemaValidatedComponent.js",
        "./node_modules/gpii-json-schema/src/js/common/schemaValidatedModelComponent.js",
        "./node_modules/json5/dist/index.js",
        "./src/css/demo.css",
        "./src/js/demo.js"
    ],
    listeners: {
        "onCreate.createBundle": {
            funcName: "gpii.schema.demo.generator.makeBundle",
            args:     ["{that}"]
        }
    }
});

gpii.schema.demo.generator();
