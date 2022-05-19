# ts-resolution-issue

## Setup

This repo demonstrates a resolution issue in TypeScript when using `references` and symlinks inside a monorepo.

The repo requires no setup except for npm to be installed on the machine.

To see the errors, run `npx tsc -b packages/subpackage-d`. Commenting out the first error and rerunning the command will show the second error.

## The problem

I believe the problem is that typescript is caching dependencies when it first finds them, and uses the same located version of that dependency when it finds it used later, even if that dependency should not be reachable. This repo demonstrates that inside of `subpackage-d`, which has an index file that imports `fake-dep` and creates some variables. `tsc` reports a problem though, that `other_bad` should be a `string`, and that `bad cannot be named without a reference to 'subpackage-a/node_modules/fake-dep/dist/BadType'`. These errors occur because rather than `subpackage-d` using the version of `fake-dep` found inside its `node_modules`, it uses the version found inside of `subpackage-a`'s `node_modules`.

Through testing it seems that `subpackage-a`'s version is being used because `subpackage-d` refernces and imports `subpackage-c`, and following the chain of references and imports eventually reaches the import for `fake-dep` inside of `subpackage-a`. This seems to then be cached, and when TypeScript finally gets back to `subpackage-d`'s index file, it uses the cached version for `fake-dep`, rather than looking for a version from the current folder. I believe this to be a caching issue because if the file inside `subpackage-d` that imports `subpackage-c` (`indew.js`) is alphabetically located after the index file, such as renaming it to `indey.js`, the issue no longer exists.

### Why this is a problem

For most purposes, the caching of a dependency like `fake-dep` would not matter. In fact one of the two issues, the one with `other-bad` saying it should be a `string` is not an issue that would normally come up, it only occurs here because I have manually edited the files inside `node_modules` to be different event though `subpackage-d` and `subpackage-a` have dependencies on the same version, and thus the files should all be the same.

The second issue with `bad cannot be named without a reference to 'subpackage-a/node_modules/fake-dep/dist/BadType'` is a real problem though. Because TypeScript has cached the inital location of where `fake-dep` was resolved to inside `subpackage-a`, it believes that types can not be inferred without a reference to that location, as it does not see that `subpackage-d` has any direct refernece to `subpackage-a/node_modules/fake-dep/dist/BadType`. This is likely the reason for many of the `ts(2742)` issues people have had in the past, as it is erroneous and very confusing to track down why an error is being reported.

### What should happen instead

Rather then directly using the cached version of a dependency, TypeScript should use use the same computed exported types but change the location where it has marked the types as being resolved from. This would keep the benefit of not recalculating types for the same pacakage, but would fix the error where it thinks types are being used without a reference.

### Screenshot of the issue

![image](https://user-images.githubusercontent.com/50465383/169198524-7c565726-ff18-4fcd-8a4f-6c22dcf361f9.png)
