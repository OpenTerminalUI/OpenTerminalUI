{
  description = "Hybrid Rust + Ink Terminal App Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    # Rust overlay để pin version Rust mới nhất
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };
        
        # Setup Rust Toolchain (Stable)
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer" ];
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Runtime & Managers
            bun
            nodejs_20 # Cần thiết: NAPI cần headers của Node để build
            moon      # Build Orchestration
            
            # Languages
            rustToolchain
            
            # System Dependencies (Quan trọng cho Rust compile/OpenSSL)
            pkg-config
            openssl
            gcc
          ] ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
             # Frameworks bắt buộc cho macOS
             pkgs.darwin.apple_sdk.frameworks.Security
             pkgs.darwin.apple_sdk.frameworks.CoreFoundation
          ];

          shellHook = ''
            echo "🚀 Hybrid TUI Environment Loaded!"
            echo "Bun: $(bun --version) | Rust: $(rustc --version) | Moon: $(moon --version)"
            
            # Fix path cho node-gyp/napi tìm thấy binary
            export PATH=$PATH:$(pwd)/node_modules/.bin
          '';
        };
      }
    );
}
