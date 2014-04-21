gas-fs
======

A set of utility functions intended to make working with Google Apps Script
Drive Service (DriveApp)  a little easier.  In particular, support for glob-like
loading of files and directories, as well as simplified path access via a string.

All of this is pretty slow, so take care to make call it asynchronously if it is
tied at all to a user interface.


#### What do you mean by File and Folder?
When we say File or Folder, we're referring to the kinds referred to by the DriveApp service.

### Usage
#### Get a copy of the utility.
```javascript
var fu = FileUtil();
```

#### Get files using a glob-like pattern
```javascript
var files = fu.getFilesByGlob("/path/to/some/?older/file.*");
  files.forEach(function(file){
  var str = file.getBlob().getDataAsString(); 
  Logger.log(str).
});
```

#### Get an array of Files by path
```javascript
// same as fu.getFiles("/path/to/file", DriveApp.getRootFolder());
var files = fu.getFilesByPath("/path/to/file");  

//files is an array of File
files.forEach(function(file){
  var str = file.getBlob().getDataAsString(); 
  Logger.log(str);
});
```

#### Get a single Folder (not an array!)
```javascript
// same as fu.getFolderbyPath("/path/to/folder", DriveApp.getRootFolder());
var folder = fu.getFolderByPath("/path/to/folder");  
```

#### Get an array of Folders using a glob-like pattern
```javascript
var folders = fu.getFoldersByGlob("/path/to/folder*");  //same as getFoldersByGlob("/path/to/folder*", DriveApp.getRootFolder()); 
```

#### Get the path leading up to a file, as an array.
```javascript
//contrived example because we obviously know the path to file here
var file = u.getFilesByPath("/path/to/a/file")[0];
var path = util.getPathTo(file);
Logger.log('/' + path.join('/')); // "/path/to/a/"

```

#### Our Use Case
###### I mean, really, why?
We view this as a kind of necessary evil at the moment.  Our use case was that we had a set of files that were dumped by a third party application to a Google Drive and needed to be loaded and massaged as a batch operation.  Because the naming of and paths to folders in that structure were really its metadata, we had no choice but to spend time fiddling with DriveApp as a service, which doesn't really lend well to the unix-y type way of reasoning about files.

#### Limitations
###### It's not O(1).
As this was written, I couldn't find anything that let me work with paths the way I wanted to.  Paths kind of felt like a second-class citizen (where file keys/ids rule the land).  So this is all just "are you my momma?" type stuff, and is probably like O(n) where n=number of files in your drive.  

###### That sucks.
Yeah.

But hey it'd be useful to have this thing remember the structure of the filesystem after it has gone digging so it doesn't have to hit up DriveApp for the info on subsequent calls (scripts are short lived anyhow).  We'll take the push if it looks reasonable.

### License
Copyright 2014 [McDaniel Gilbert, Inc](http://mcdanielgilbert.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

### Contact
Clone away if you like.  This code is available as a library within the Google Apps Library, but realistically you just want the code anyhow.  You can get me at [tom.mclaughlin@mcdanielgilbert.com](tom.mclaughlin@mcdanielgilbert.com).
