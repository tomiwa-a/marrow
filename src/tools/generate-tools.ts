
import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);

if (args.length < 1) {
  console.log("Usage: npm run generate-tools <module_name>");
  console.log("Example: npm run generate-tools linkedin");
  process.exit(1);
}

const moduleName = args[0];
const rootDir = path.resolve(__dirname, "../../"); 
const sourceFile = path.resolve(rootDir, `src/modules/${moduleName.toLowerCase()}/navigation.ts`);
const outputFile = path.resolve(rootDir, `src/modules/${moduleName.toLowerCase()}/tools.json`);

const targetClassName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1) + "Navigator";

interface ToolParameter {
  type: string;
  description?: string;
  enum?: string[];
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}

function generateTools() {
  if (!fs.existsSync(sourceFile)) {
      console.error(`Error: Module navigation file not found: ${sourceFile}`);
      process.exit(1);
  }

  console.log(`Module: ${moduleName}`);
  console.log(`Source: ${sourceFile}`);
  console.log(`Target Class: ${targetClassName}`);

  const fileContent = fs.readFileSync(sourceFile, "utf8");
  const sourceNode = ts.createSourceFile(
    sourceFile,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );

  const tools: ToolDefinition[] = [];
  let foundClass = false;

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node) && node.name?.text.toLowerCase() === targetClassName.toLowerCase()) {
      foundClass = true;
      node.members.forEach((member) => {
        if (ts.isMethodDeclaration(member)) {
          const modifiers = member.modifiers?.map(m => m.kind);
          if (modifiers?.includes(ts.SyntaxKind.PrivateKeyword)) return;

          const toolName = member.name.getText(sourceNode);
          
          let description = "";
          const jsDoc = (member as any).jsDoc; 
          if (jsDoc && jsDoc.length > 0) {
             description = jsDoc[0].comment || "";
          }

          const properties: Record<string, ToolParameter> = {};
          const required: string[] = [];

          member.parameters.forEach((param) => {
            const paramName = param.name.getText(sourceNode);
            const paramType = param.type ? param.type.getText(sourceNode) : "string";
            const isOptional = param.questionToken || param.initializer;

            let type = "string";
            let enumValues: string[] | undefined;
            let paramDesc = "";

            if (paramType === "number") type = "number";
            else if (paramType === "boolean") type = "boolean";
            else if (paramType.includes("|")) {
                type = "string";
                enumValues = paramType.split("|").map(s => s.trim().replace(/['"]/g, ""));
            }

            if (jsDoc && jsDoc[0].tags) {
                const paramTag = jsDoc[0].tags.find((t: any) => 
                    t.tagName.getText(sourceNode) === "param" && 
                    t.name.getText(sourceNode) === paramName
                );
                if (paramTag) {
                    paramDesc = paramTag.comment || "";
                }
            }

            if (!["string", "number", "boolean", "any"].includes(type) && /^[A-Z]/.test(paramType)) {
                 type = "object"; 
                 paramDesc += ` (Type: ${paramType})`;
            }

            properties[paramName] = {
                type,
                enum: enumValues,
                description: paramDesc
            };

            if (!isOptional) {
                required.push(paramName);
            }
          });

          tools.push({
            name: toolName,
            description,
            parameters: {
              type: "object",
              properties,
              required: required.length > 0 ? required : undefined,
            },
          });
        }
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceNode);

  if (!foundClass) {
      console.error(`Error: Class '${targetClassName}' not found in ${sourceFile}`);
      const classes: string[] = [];
      ts.forEachChild(sourceNode, n => {
          if (ts.isClassDeclaration(n) && n.name) classes.push(n.name.text);
      });
      console.log(`Available classes: ${classes.join(", ")}`);
      process.exit(1);
  }

  console.log(`Extracted ${tools.length} methods.`);
  fs.writeFileSync(outputFile, JSON.stringify(tools, null, 2));
  console.log(`Saved to: ${outputFile}`);
}

generateTools();
