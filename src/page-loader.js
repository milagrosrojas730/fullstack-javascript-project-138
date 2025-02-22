import axios from 'axios';
import { promises as fs } from 'fs';
import { URL } from 'url';
import path from 'path';
import debug from 'debug';
import _ from 'lodash';
import Listr from 'listr';
import * as cheerio from 'cheerio';
import {  urlToFilename, urlToDirname, getExtension, sanitizeOutputDir} from './utils.js';

const log = debug('page-loader'); //logger

//procesa las url 
const processResource = ($, tagme, attrName, barl, brname, assets) => {
  const $elements = $(tagme).toArray();
  const elementsWithUrls = $elements
    .map((element) => $(element))
    .filter(($element) => $element.attr(attrName))
    .map(($element) => ({ $element, url: new URL($element.attr(attrName), barl) }))
    .filter(({ url }) => url.origin === barl);

  elementsWithUrls.forEach(({ $element, url }) => {
    const slug = urlToFilename(`${url.hostname}${url.pathname}`);
    const filepath = path.join(brname, slug);
    assets.push({ url, filename: slug });
    $element.attr(attrName, filepath);
  });
};
//Obtiene todos los recursos
const processResources = (barl, brname, html) => {
  const $ = cheerio.load(html, { decodeEntities: false });
  const assets = [];

  processResource($, 'img', 'src', barl, brname, assets);
  processResource($, 'link', 'href', barl, brname, assets);
  processResource($, 'script', 'src', barl, brname, assets);

  return { html: $.html(), assets };
};

const downloadAsset = (dirname, { url, filename }) => axios.get(url.toString(), { responseType: 'arraybuffer' }).then((response) => {
  const fullPath = path.join(dirname, filename);
  return fs.writeFile(fullPath, response.data);
});

//Funcion principal
const pageLoader = (pageUrl, outputDirName = '') => {
  const sanitizedDir = sanitizeOutputDir(outputDirName);

  if (!sanitizedDir) {
    return Promise.reject(new Error(` No se puede usar el directorio restringido: ${outputDirName || process.cwd()}`));
  }

  log('url', pageUrl);
  log('output', sanitizedDir);

  const url = new URL(pageUrl);
  const slug = `${url.hostname}${url.pathname}`;
  const filename = urlToFilename(slug);
  const fullOutputDirname = path.resolve(sanitizedDir);
  const extension = getExtension(filename) === '.html' ? '' : '.html';
  const fullOutputFilename = path.join(fullOutputDirname, `${filename}${extension}`);
  const assetsDirname = urlToDirname(slug);
  const fullOutputAssetsDirname = path.join(fullOutputDirname, assetsDirname);

  let data;
  return axios
    .get(pageUrl)
    .then((response) => {
      const html = response.data;

      data = processResources(url.origin, assetsDirname, html);
      log('create (if not exists) directory for assets', fullOutputAssetsDirname);
      return fs.access(fullOutputAssetsDirname).catch(() => fs.mkdir(fullOutputAssetsDirname));
    })
    .then(() => {
      log(`HTML saved: ${fullOutputFilename}`);
      return fs.writeFile(fullOutputFilename, data.html);
    })
    .then(() => {
      const tasks = data.assets.map((asset) => {
        log('asset', asset.url.toString(), asset.filename);
        return {
          title: asset.url.toString(),
          task: () => downloadAsset(fullOutputAssetsDirname, asset).catch(_.noop),
        };
      });

      const listr = new Listr(tasks, { concurrent: true });
      return listr.run();

    })
    .then(() => {
      log(` File successfully saved at: ${fullOutputFilename}`);
      return { filepath: fullOutputFilename };
    });
};

export default pageLoader;