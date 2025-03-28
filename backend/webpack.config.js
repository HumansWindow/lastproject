// @ts-nocheck
const { composePlugins, withNx } = require('@nrwl/webpack');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = composePlugins(withNx(), (config) => {
  // Add the externals option to exclude node_modules from bundling
  config.externals = [
    nodeExternals({
      // Allow bundling of these specific modules
      allowlist: [],
    }),
  ];

  // Add native modules that should be treated as externals
  const nativeModules = [
    'sqlite3',
    'pg-native',
    'better-sqlite3', 
    '@mapbox/node-pre-gyp',
    'bcrypt',
    'canvas',
    'sharp',
    'aws-sdk',
    'mock-aws-s3',
    'nock',
    'node-gyp'
  ];
  
  nativeModules.forEach(mod => {
    config.externals.push(function(context, request, callback) {
      if (request.indexOf(mod) !== -1) {
        return callback(null, 'commonjs ' + request);
      }
      callback();
    });
  });
  
  config.module = {
    rules: [
      // Handle native module files with ignore-loader
      {
        test: /\.(node|cs|html)$/,
        use: 'ignore-loader'
      },
      // Explicitly ignore problematic files in node_modules
      {
        test: /node_modules\/@mapbox\/node-pre-gyp\/.*\.(html|cs|js)$/,
        use: 'ignore-loader'
      },
      {
        test: /node_modules\/node-gyp\/.*\.(html|cs|js)$/,
        use: 'ignore-loader'
      },
      // Ignore AWS related modules that are causing issues
      {
        test: /aws-sdk|mock-aws-s3|nock/,
        use: 'ignore-loader'
      }
    ]
  };
  
  config.resolve = {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "crypto": false,
      "path": false,
      "fs": false,
      "util": false,
      "net": false,
      "tls": false,
      "child_process": false,
      "aws-sdk": false,
      "mock-aws-s3": false,
      "nock": false
    }
  };
  
  config.output = {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  };
  
  config.optimization = {
    nodeEnv: false
  };
  
  config.node = {
    __dirname: false,
    __filename: false,
    global: true
  };
  
  config.ignoreWarnings = [
    {
      module: /node_modules\/@mapbox\/node-pre-gyp/,
    },
    {
      module: /node_modules\/bcrypt/,
    },
    {
      module: /node_modules\/node-gyp/,
    },
    {
      module: /aws-sdk/,
    },
    {
      module: /mock-aws-s3/,
    },
    {
      module: /nock/,
    },
    // Ignore HTML parsing warnings
    {
      message: /Critical dependency: the request of a dependency is an expression/,
    }
  ];
  
  return config;
});
