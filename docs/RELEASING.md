# Publishing Checklist

1. Run `npm ci`, `npm test`, `npm run build`, and `npm run check:public`.
2. Review `git status --short`, `git diff --cached`, and `git ls-files`. No private
   audio, lyrics/timings, exports, models, secrets, or work files should be tracked.
   Ignore rules do not erase prior commits; inspect history as well.
3. Review LICENSE, THIRD_PARTY_NOTICES.md, and dependency terms. Remotion's license
   is separate from this project's MIT license.
4. Test a clean clone using the original sample, not a user's recording. Render a
   short MP4; verify audio, dimensions, and duration.
5. Confirm GitHub owner/repository and public visibility with the user before creating
   a remote or pushing. Never publish personal media without permission/rights.
6. Set up appropriate private security reporting and list known limitations.
