/* globals JSON5 */
(function (fluid, JSON5) {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.schema.demo");

    gpii.schema.demo.validate = function (that) {
        var outputElement  = that.locate("validationOutput");
        var calloutElement = that.locate("callout");

        var gssSchema = fluid.extend({}, that.options.schemaBoilerplate, that.model.gssSchema);
        var validationOutput = gpii.schema.validator.validate(that.model.toValidate, gssSchema);

        calloutElement.removeClass("primary");
        if (validationOutput.isValid) {
            calloutElement.removeClass("alert");
            calloutElement.addClass("success");
            outputElement.html("The data you provided is valid.");
        }
        else {
            calloutElement.removeClass("success");
            calloutElement.addClass("alert");
            if (validationOutput.isError) {
                outputElement.html(validationOutput.message);
            }
            else {
                var localisedErrors = gpii.schema.validator.localiseErrors(validationOutput.errors, that.model.toValidate);
                var localisedValidationOutput = fluid.extend(fluid.filterKeys(validationOutput, ["errors"], true), { errors: localisedErrors });
                outputElement.html(JSON.stringify(localisedValidationOutput, null, 2));
            }
        }
    };

    gpii.schema.demo.handleKeyUp = function (that, event) {
        if (["Enter", "Space"].indexOf(event.which) !== -1) {
            that.validate();
        }
    };

    fluid.registerNamespace("gpii.schema.demo.transforms");

    // TODO: Discuss updating fluid.transforms.JSONstringToObject
    gpii.schema.demo.transforms.JSON5ToObject = function (value) {
        try {
            return JSON5.parse(value);
        }
        catch (e) {
            return undefined;
        }
    };

    gpii.schema.demo.transforms.JSON5ToObject.invert = function (transformSpec) {
        transformSpec.type = "fluid.transforms.objectToJSON5";
        return transformSpec;
    };

    fluid.defaults("gpii.schema.demo.transforms.JSON5ToObject", {
        gradeNames: ["fluid.standardTransformFunction", "fluid.lens"],
        invertConfiguration: "gpii.schema.demo.transforms.JSON5ToObject.invert"
    });

    gpii.schema.demo.transforms.objectToJSON5 = function (value) {
        try {
            return JSON5.stringify(value, { space: 2, quote: "\""});
        }
        catch (e) {
            return undefined;
        }
    };

    gpii.schema.demo.transforms.objectToJSON5.invert = function (transformSpec) {
        transformSpec.type = "fluid.transforms.JSON5ToObject";
        return transformSpec;
    };

    fluid.defaults("gpii.schema.demo.transforms.objectToJSON5", {
        gradeNames: ["fluid.standardTransformFunction", "fluid.lens"],
        invertConfiguration: "gpii.schema.demo.transforms.objectToJSON5.invert"
    });

    fluid.defaults("gpii.schema.demo", {
        gradeNames: ["gpii.binder"],
        schemaBoilerplate: {
            $schema: "gss-v7-full#"
        },
        selectors: {
            callout:          ".callout",
            gssSchema:        ".gss-schema-input",
            toValidate:       ".json-data-input",
            validationOutput: ".validation-output",
            validateButton:   ".validate-button"
        },
        model: {
            gssSchema:   {
                properties: {
                    "foo": {
                        required: true
                    }
                }
            },
            toValidate:  {
                bar: "another property"
            }
        },
        rules: {
            jsonAndObject: {
                domToModel: {
                    "": {
                        transform: {
                            type: "gpii.schema.demo.transforms.JSON5ToObject",
                            inputPath: ""
                        }
                    }
                },
                modelToDom: {
                    "": {
                        transform: {
                            type: "gpii.schema.demo.transforms.objectToJSON5",
                            inputPath: ""
                        }
                    }
                }
            }
        },
        bindings: {
            gssSchema: {
                selector: "gssSchema",
                path:     "gssSchema",
                rules:    "{that}.options.rules.jsonAndObject"
            },
            toValidate: {
                selector: "toValidate",
                path:     "toValidate",
                rules:    "{that}.options.rules.jsonAndObject"
            }
        },
        invokers: {
            validate: {
                funcName: "gpii.schema.demo.validate",
                args:     ["{that}"]
            },
            handleKeyUp: {
                funcName: "gpii.schema.demo.handleKeyUp",
                args:     ["{that}", "{arguments}.0"] // event
            }
        },
        listeners: {
            "onCreate.applyBindings": {
                "funcName": "gpii.binder.applyBinding",
                "args":     ["{that}"]
            },
            "onCreate.wireValidationClick": {
                "this":   "{that}.dom.validateButton",
                "method": "click",
                "args":   ["{that}.validate"]
            },
            "onCreate.wireValidationKeyPress": {
                "this":   "{that}.dom.validateButton",
                "method": "keyup",
                "args":   ["{that}.handleKeyUp"]
            }
        }
    });
})(fluid, JSON5);
