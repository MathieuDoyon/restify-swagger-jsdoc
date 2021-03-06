"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restify = require("restify");
const swaggerJSDoc = require("swagger-jsdoc");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");
function createSwaggerPage(options) {
    if (!options.title) {
        throw new Error('options.title is required');
    }
    else if (!options.version) {
        throw new Error('options.version is required');
    }
    else if (!options.server) {
        throw new Error('options.server is required');
    }
    else if (!options.path) {
        throw new Error('options.path is required');
    }
    const swaggerUiPath = path.dirname(require.resolve('swagger-ui'));
    const swaggerSpec = swaggerJSDoc({
        swaggerDefinition: {
            info: {
                title: options.title,
                version: options.version
            },
        },
        apis: options.apis || []
    });
    if (options.definitions) {
        Object.keys(options.definitions).forEach(key => {
            swaggerSpec.definitions[key] = options.definitions[key];
        });
    }
    if (options.routePrefix && swaggerSpec.hasOwnProperty('paths')) {
        Object.keys(swaggerSpec.paths).forEach(key => {
            swaggerSpec.paths['/' + options.routePrefix + key] = swaggerSpec.paths[key];
            delete (swaggerSpec.paths[key]);
        });
    }
    const publicPath = options.path.replace(/\/+$/, '');
    options.server.get(`${publicPath}/swagger.json`, (req, res, next) => {
        res.setHeader('Content-type', 'application/json');
        res.send(swaggerSpec);
        return next();
    });
    options.server.get(new RegExp(publicPath + '\/?$'), (req, res, next) => {
        res.setHeader('Location', `${publicPath}/index.html`);
        res.send(302);
        return next();
    });
    options.server.get(new RegExp(publicPath + '\/(.*)$'), (req, res, next) => {
        fs.readFile(path.resolve(swaggerUiPath, req.params[0]), (err, content) => {
            if (err) {
                return next(new restify.NotFoundError(`File ${req.params[0]} does not exist`));
            }
            if (req.params[0] === 'index.html') {
                const isReqSecure = options.forceSecure || req.isSecure();
                const jsonFileUrl = `${isReqSecure ? 'https' : 'http'}://${req.headers.host}${publicPath}/swagger.json`;
                content = new Buffer(content.toString().replace('url = "http://petstore.swagger.io/v2/swagger.json"', `url ="${jsonFileUrl}"`));
            }
            const contentType = mime.lookup(req.params[0]);
            if (contentType !== false) {
                res.setHeader('Content-Type', contentType);
            }
            res.write(content);
            res.end();
            return next();
        });
    });
}
exports.createSwaggerPage = createSwaggerPage;
exports.default = { createSwaggerPage };
//# sourceMappingURL=index.js.map