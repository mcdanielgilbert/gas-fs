/**
 * A set of utility functions intended to make working with Google Apps Script
 * Drive Service (DriveApp)  a little easier.  In particular, support for glob-like
 * loading of files and directories, as well as simplified path access via a string.
 *
 * All of this is pretty slow, so take care to make call it asynchronously if it is
 * tied at all to a user interface.
 *
 * Usage:
 * var fu = FileUtil();
 *
 * // get files using a glob-like pattern
 * var files = fu.getFilesByGlob("/path/to/some/?older/file.*");
 *   files.forEach(function(file){
 *   var str = file.getBlob().getDataAsString(); 
 * });
 *
 * // get an array of files by path
 * var files = fu.getFilesByPath("/path/to/file");  // same as fu.getFiles("/path/to/file", DriveApp.getRootFolder());
 * files.forEach(function(file){
 *   var str = file.getBlob().getDataAsString(); 
 * });
 * 
 * // get a single folder (not an array!)
 * var folder = fu.getFolderByPath("/path/to/folder");  // same as fu.getFolderbyPath("/path/to/folder", DriveApp.getRootFolder());
 *
 * // get an array of folders using a glob-like pattern
 * var folders = fu.getFoldersByGlob("/path/to/folder*");  //same as getFoldersByGlob("/path/to/folder*", DriveApp.getRootFolder()); 
 *
 * // path leading up to a file, as an array
 * var file = u.getFilesByPath("/path/to/a/file")[0];
 * var path = util.getPathTo(file);
 * Logger.log('/' + path.join('/')); // "/path/to/a/"
 */
function FileUtil(){
  var util = {};
  
	/**
	 * Gets an array of files with the given path, starting at startFolder or the root
	 * folder if no start folder is given.  If no files are found, returns [];
	 * @param {string} path to a file
	 * @param {Folder} folder in which to start looking
	 */
	util.getFilesByPath = function(path, startFolder){
		var pathElts = path.replace(/^\//,'').split('/');
		var filename = pathElts.pop();
		var files = [];

		(function dig(pathArray, folder){
			if(pathArray.length === 0){
				var fs = folder.getFilesByName(filename);
				while(fs.hasNext()){
					files.push(fs.next()); 
				}
            } else {
              for(var i = 0; i < pathArray.length; i++){
                var folders = folder.getFoldersByName(pathArray[i]);
                while(folders.hasNext()){
                  var f = folders.next();
                  dig(pathArray.slice(1), f);
                }
              }
            }
		})(pathElts, startFolder || DriveApp.getRootFolder());

		return files;
	};



	/**
	 * Gets the path to the given file as an array of strings by
	 * recursively looking for parent folders.
	 * @param {File} file
	 */
	util.getPathTo = function(file){
		var parents = file.getParents();
		if(parents.hasNext()){
			var parent = parents.next();
			return this(parent).concat([parent.getName()]);
		} else {
			return []; 
		}  
	};

	/**
	 * Searches for files that match the given glob.  Begins 
	 * the search in startFolder.  Example usage is
	 * getFilesByGlob("/path/to/file.*")
	 *
	 * @param {String} glob 
	 * @param {Folder} [startFolder=DriveApp.getRootFolder()] 
	 */
	// literal text for the example included in the above JsDoc:
	util.getFilesByGlob = function(glob, startFolder){
		startFolder = startFolder || DriveApp.getRootFolder();
		var globs = glob.split('/');
		var fileRegex = globToRegex(globs.pop());

		var matches = [];
		var folders = this.getFoldersByGlob(globs.join('/'), startFolder);
		folders.forEach(function(f){
			var files = f.getFiles();
			while(files.hasNext()){
				var file = files.next();
				if(file.getName().match(fileRegex)){
					matches.push(file);
				}
			}
		});

		return matches;
	};


	/**
	 * Returns an array containing all of the folders which match
	 * the given file glob, starting at Folder startFolder.  Sorry,
	 * no support for globstar (**).
	 * @param {String} glob a glob string in the unix style, e.g. /
	 * @param {Folder} [startFolder=DriveApp.getRootFolder()] the folder
	 * in which to begin searching.
	 */
	util.getFoldersByGlob = function(glob, startFolder){
		var currentFolder = startFolder || DriveApp.getRootFolder();
		globs = glob.split('/');
		if(globs.length && !globs[0]){
			globs = globs.slice(1); 
		}

		var matchedFolders = [];  
		(function doIt(globList, folder){
			var regex = globToRegex(globList[0]);
			var childFolders = folder.getFolders();
			while(childFolders.hasNext()){
				var child = childFolders.next();
				if(child.getName().match(regex)){
					if(globList.length == 1){
						matchedFolders.push(child);
					}
					doIt(globList.slice(1), child);
				}
			}
		})(globs, currentFolder);
		return matchedFolders;
	};

	/**
	 * Finds the folder with the given path.
	 * @param {String} path a string path, e.g. "/var/log"
	 * @param {Folder} startFolder the folder in which to start searching.
	 */
	util.getFolderByPath = function(path, startFolder){
		var currentFolder = startFolder || DriveApp.getRootFolder();
		var pathElts = path.split('/');
		if(pathElts.length && !pathElts[0]){
			pathElts = pathElts.slice(1); 
		}

		for(var i = 0; i < pathElts.length; i++){
			var elt = pathElts[i];
			var childFolders = currentFolder.getFoldersByName(elt);

			if(childFolders.hasNext()){
				currentFolder = childFolders.next();
			} else {
				currentFolder = null;
				break; 
			}
		}

		return currentFolder;

	};

	/**
	 * Takes a glob as a string and returns the equivalent RegExp.
	 *
	 * This section taken from https://github.com/fitzgen/glob-to-regexp.
	 * Copyright (c) 2013, Nick Fitzgerald
	 * All rights reserved.
	 * 
	 * Redistribution and use in source and binary forms, with or without 
	 * modification, are permitted provided that the following 
	 * conditions are met:
	 * 
	 * Redistributions of source code must retain the above copyright notice,
	 * this list of conditions and the following disclaimer.
	 * 
	 * Redistributions in binary form must reproduce the above copyright notice, 
	 * this list of conditions and the following disclaimer in the 
	 * documentation and/or other materials provided with the distribution.
	 * 
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 *  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, 
	 *  THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR 
	 *  PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS 
	 *  BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
	 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
	 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR 
	 *  BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, 
	 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR 
	 *  OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, 
	 *  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */
	var globToRegex = function(glob, opts) {
		if (glob === null) {
			return null;
		}

		var str = String(glob);

		// The regexp we are building, as a string.
		var reStr = "";

		// Whether we are matching so called "extended" globs (like bash) and should
		// support single character matching, matching ranges of characters, group
		// matching, etc.
		var extended = opts ? !!opts.extended : false;

		// If we are doing extended matching, this boolean is true when we are inside
		// a group (eg {*.html,*.js}), and false otherwise.
		var inGroup = false;

		var c;
		for (var i = 0, len = str.length; i < len; i++) {
			c = str[i];

			switch (c) {
				case "\\":
				case "/":
				case "$":
				case "^":
				case "+":
				case ".":
				case "(":
				case ")":
				case "=":
				case "!":
				case "|":
					reStr += "\\" + c;
					break;

				case "?":
					if (extended) {
						reStr += ".";
						break;
					}

				case "[":
				case "]":
					if (extended) {
						reStr += c;
						break;
					}

				case "{":
					if (extended) {
						inGroup = true;
						reStr += "(";
						break;
					}

				case "}":
					if (extended) {
						inGroup = false;
						reStr += ")";
						break;
					}

				case ",":
					if (inGroup) {
						reStr += "|";
						break;
					}
					reStr += "\\" + c;
					break;

				case "*":
					reStr += ".*";
					break;

				default:
					reStr += c;
			}
		}

		return new RegExp("^" + reStr + "$");
	};
  
  return util;
}

