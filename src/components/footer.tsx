import { HidePageChrome } from "./hide-page-chrome";

export default function Footer() {
  return (
    <HidePageChrome>
      <footer className="text-center bg-base-200 py-2">
        Copyright btmxh, Kurogaisha Group 2025. All rights reserved. Source code
        is available on{" "}
        <a className="link" href="https://github.com/btmxh/gym-tsfr">
          GitHub
        </a>
        .
      </footer>
    </HidePageChrome>
  );
}
