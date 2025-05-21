declare module 'diff-match-patch' {
  export class diff_match_patch {
    diff_main(text1: string, text2: string): Diff[];
    diff_cleanupSemantic(diffs: Diff[]): void;
    diff_toHtml(diffs: Diff[]): string;
    // Add other methods you might use from diff-match-patch
  }

  export enum DiffOp {
    DELETE = -1,
    INSERT = 1,
    EQUAL = 0,
  }

  export type Diff = [DiffOp, string];

  // If the library exports the class as default or has a specific main export:
  // const diff_match_patch: new () => diff_match_patch;
  // export default diff_match_patch;
} 