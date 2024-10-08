// react-load-script.d.ts
declare module "react-load-script" {
  import { Component } from "react";

  interface ScriptProps {
    url: string;
    onCreate?: () => void;
    onError?: (event: any) => void;
    onLoad?: () => void;
    attributes?: { [key: string]: string };
  }

  class Script extends Component<ScriptProps> {}

  export default Script;
}
