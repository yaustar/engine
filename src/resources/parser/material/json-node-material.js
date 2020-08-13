import { NodeMaterial, shadergraph } from '../../../scene/materials/node-material.js';

/**
 * @class
 * @name pc.JsonNodeMaterialParser
 * @description Convert incoming JSON data into a {@link pc.NodeMaterial}.
 * @param {pc.GraphicsDevice} device - The graphics device of the application - required for creating placeholder
 */
function JsonNodeMaterialParser(device) {
    this._device = device;
    this._validator = null;

    this._placeholderNodeMat = this._genPlaceholderNodeMat();
}

JsonNodeMaterialParser.prototype.parse = function (input) {
    var migrated = this.migrate(input);
    var validated = this._validate(migrated);

    var material = new NodeMaterial();
    this.initialize(material, validated);

    return material;
};

/**
 * @function
 * @name pc.JsonNodeMaterialParser#initialize
 * @description  Initialize material properties from the material data block e.g. Loading from server.
 * @param {pc.StandardMaterial} material - The material to be initialized.
 * @param {object} data - The data block that is used to initialize.
 */
JsonNodeMaterialParser.prototype.initialize = function (material, data) {
    var i = 0;
    var material_ready = true;
    // input or output or constant variables - all node material types have this block
    if (data.graphData.graphVars) {
        for (i = 0; i < Object.keys(data.graphData.graphVars).length; i++) {
            if (data.graphData.graphVars[i].type === 'sampler2D' && data.graphData.graphVars[i].valueTex) {
                if (typeof(data.graphData.graphVars[i].valueTex) === 'number' && data.graphData.graphVars[i].valueTex > 0) {
                    // texture asset not loaded yet - deal with in node material binder
                    if (!(material.graphData.graphVars[i] && material.graphData.graphVars[i].valueTex)) {
                        // seems no placeholder is set yet
                        material_ready = false;
                    }
                } else {
                    // texture asset loaded - assign
                    material.graphData.graphVars[i] = {};
                    Object.assign(material.graphData.graphVars[i], data.graphData.graphVars[i]);
                }
            } else {
                // assign directly - we (probably) don't need to convert to Vec2/3/4 objects?
                material.graphData.graphVars[i] = {};
                Object.assign(material.graphData.graphVars[i], data.graphData.graphVars[i]);

                // deal with 0 being undefined if default or optional
                var var_type = material.graphData.graphVars[i].type;
                if (material.graphData.graphVars[i].valueW === undefined && var_type === 'vec4') material.graphData.graphVars[i].valueW = 0;
                if (material.graphData.graphVars[i].valueZ === undefined && (var_type === 'vec4' || var_type === 'vec3' )) material.graphData.graphVars[i].valueZ = 0;
                if (material.graphData.graphVars[i].valueY === undefined && (var_type === 'vec4' || var_type === 'vec3' || var_type === 'vec2' )) material.graphData.graphVars[i].valueY = 0;
                if (material.graphData.graphVars[i].valueX === undefined && (var_type === 'vec4' || var_type === 'vec3' || var_type === 'vec2' || var_type === 'float' )) material.graphData.graphVars[i].valueX = 0;
            }
        }
    }

    if (data.graphData.customFuncGlsl) {
        // this means this is a custom node (often also has a decl shader)
        if (data.graphData.customDeclGlsl) {
            if (typeof(data.graphData.customDeclGlsl) === 'number' && data.graphData.customDeclGlsl > 0) {
                // this means asset is not loaded yet - cannot assign
                material_ready = false;
            } else {
                // shader asset loaded - assign!
                material.graphData.customDeclGlsl = data.graphData.customDeclGlsl;
            }
        }

        if (data.graphData.customFuncGlsl) {
            if (typeof(data.graphData.customFuncGlsl) === 'number' && data.graphData.customFuncGlsl > 0) {
                // this means asset is not loaded yet - cannot assign
                material_ready = false;
            } else {
                // shader asset loaded - assign and generate matching graphVars
                material.graphData.customFuncGlsl = data.graphData.customFuncGlsl;
                material.graphData.graphVars.length = 0;
                material.genCustomFuncVars();

                // copy values that match into new graph variables - if not matching reset
                // TODO: make this more robust (match name even if index doesn't match)?
                if (material.graphData.graphVars) {
                    for (i = 0; i < material.graphData.graphVars.length; i++) {
                        // if (data.graphData.graphVars && i<data.graphData.graphVars.length && material.graphData.graphVars[i].name===data.graphData.graphVars[i].name && material.graphData.graphVars[i].type===data.graphData.graphVars[i].type )
                        if (data.graphData.graphVars && i < Object.keys(data.graphData.graphVars).length && material.graphData.graphVars[i].name === data.graphData.graphVars[i].name && material.graphData.graphVars[i].type === data.graphData.graphVars[i].type ) {
                            // exists and matches copy what is already set in the asset
                            Object.assign(material.graphData.graphVars[i], data.graphData.graphVars[i]);
                        }
                    }
                }
            }
        }
    } else if (data.graphData.subGraphs) {
        // graph node material
        if (data.graphData.connections) {
            // sub graph connections - only graph node materials have this
            material.graphData.connections = [];

            for (i = 0; i < Object.keys(data.graphData.connections).length; i++) {
                // connections are indices and names - no asset refs - so just assign
                material.graphData.connections[i] = {};
                Object.assign(material.graphData.connections[i], data.graphData.connections[i]);

                // deal with optional value problem (should no longer happen?)
                // if (material.graphData.connections[i].dstVarName && material.graphData.connections[i].dstIndex === undefined) material.graphData.connections[i].dstIndex = -1;
                // if (material.graphData.connections[i].srcVarName && material.graphData.connections[i].srcIndex === undefined) material.graphData.connections[i].srcIndex = -1;
            }
        }

        if (data.graphData.subGraphs) {
            if (material.graphData.subGraphs.length != Object.keys(data.graphData.subGraphs).length) {
                material.graphData.subGraphs.length = Object.keys(data.graphData.subGraphs).length;
            }

            for (i = 0; i < Object.keys(data.graphData.subGraphs).length; i++) {
                if (typeof(data.graphData.subGraphs[i]) === 'number' && data.graphData.subGraphs[i] > 0) {
                    // this means sub graph asset is not loaded yet
                    material_ready = false;
                    // set to something so that validation doesn't pass on all loaded sub graphs
                    material.graphData.subGraphs[i] = i;
                } else {
                    material.graphData.subGraphs[i] = data.graphData.subGraphs[i];
                }
            }
        }
    } else {
        if (data.graphData.graphVars) {
            // no custom glsl or sub graphs - this means this is a node material instance?
            // TODO: support material instances properly?
            material_ready = false;
        } else {
            // completely empty?
            material_ready = false;
        }
    }

    // only mark for update if ready dependent assets (with no placeholders) are loaded
    if (material_ready) {
        material.dirtyShader = true;
        material.update();
    } else {
        material.setPlaceHolderShader(this._placeholderNodeMat);
    }
};

// convert any properties that are out of date
// or from old versions into current version
JsonNodeMaterialParser.prototype.migrate = function (data) {
    // no conversion needed (yet)
    return data;
};

// check for invalid properties
JsonNodeMaterialParser.prototype._validate = function (data) {
    // no validation needed (yet)
    return data;
};

JsonNodeMaterialParser.prototype._genPlaceholderNodeMat = function () {
    // start building shader graph
    shadergraph.start();

    // create a blank PS shader graph node
    var blankPSNode = shadergraph.customNode('blankPS', 'vec4 blankPS() { return vec4(0,0,1,1); }');

    // hook up PS outputs
    shadergraph.connectFragOut(blankPSNode);

    // create a blank vertex offset shader graph node
    var blankVSNode = shadergraph.customNode('blankVS', 'vec3 blankVS() { return vec3(0,0,0); }');

    // hook up VS output
    shadergraph.connectVertexOffset(blankVSNode);

    // end graph and assign built graph to material
    var material = shadergraph.end();

    // initialize shader and update uniforms
    material.initShader(this._device);
    material.updateUniforms();

    return material;
};

export { JsonNodeMaterialParser };
