
import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);

if (args.length < 1) {
  console.log("Usage: npm run generate-tools <module_name>");
  process.exit(1);
}

const moduleName = args[0];
const rootDir = path.resolve(__dirname, "../../"); 
const sourceFile = path.resolve(rootDir, `src/modules/${moduleName.toLowerCase()}/navigation.ts`);
const outputFile = path.resolve(rootDir, `src/modules/${moduleName.toLowerCase()}/tools.json`);
const tsConfigPath = path.resolve(rootDir, "tsconfig.json");

const targetClassName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1) + "Navigator";

interface ToolParameter {
  type: string;
  description?: string;
  enum?: string[];
  properties?: Record<string, ToolParameter>;
  required?: string[];
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
      console.error(`Error: Module file not found: ${sourceFile}`);
      process.exit(1);
  }

  const program = ts.createProgram([sourceFile], {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.CommonJS
  });
  
  const checker = program.getTypeChecker();
  const sourceNode = program.getSourceFile(sourceFile);

  if (!sourceNode) {
      console.error("Failed to load source file.");
      process.exit(1);
  }

  const tools: ToolDefinition[] = [];
  let foundClass = false;

  function generateSchema(type: ts.Type, node?: ts.Node): ToolParameter {
      const flags = type.getFlags();
      
      if (flags & ts.TypeFlags.String) return { type: "string" };
      if (flags & ts.TypeFlags.Number) return { type: "number" };
      if (flags & ts.TypeFlags.Boolean) return { type: "boolean" };
      
      if (type.isUnion()) {
          const parts = type.types;
          const isStringUnion = parts.every(p => p.isStringLiteral());
          if (isStringUnion) {
              return { 
                  type: "string", 
                  enum: parts.map(p => (p as ts.StringLiteralType).value) 
              };
          }
      }

      if (type.isClassOrInterface() || (flags & ts.TypeFlags.Object)) {
          const props: Record<string, ToolParameter> = {};
          const required: string[] = [];
          
          type.getProperties().forEach(prop => {
              const propName = prop.getName();
              const propType = checker.getTypeOfSymbolAtLocation(prop, node || sourceNode!);
              
              const isOptional = (prop.getFlags() & ts.SymbolFlags.Optional) !== 0;
              
              let desc = "";
              const doc = prop.getDocumentationComment(checker);
              if (doc.length > 0) desc = ts.displayPartsToString(doc);

              const schema = generateSchema(propType, prop.valueDeclaration);
              schema.description = desc;
              
              props[propName] = schema;
              
              if (!isOptional) required.push(propName);
          });

          return {
              type: "object",
              properties: props,
              required: required.length > 0 ? required : undefined
          };
      }

      return { type: "string" }; 
  }

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
            const type = checker.getTypeAtLocation(param);
            
            const schema = generateSchema(type, param);
            
            // JSDoc override for top-level params
            if (jsDoc && jsDoc[0].tags) {
                const paramTag = jsDoc[0].tags.find((t: any) => 
                    t.tagName.getText(sourceNode) === "param" && 
                    t.name.getText(sourceNode) === paramName
                );
                if (paramTag && paramTag.comment) {
                    schema.description = paramTag.comment;
                }
            }
            
            properties[paramName] = schema;
            
            const isOptional = param.questionToken || param.initializer;
            if (!isOptional) required.push(paramName);
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
      console.error(`Error: Class '${targetClassName}' not found`);
      process.exit(1);
  }

  console.log(`Extracted ${tools.length} methods.`);
  fs.writeFileSync(outputFile, JSON.stringify(tools, null, 2));
  console.log(`Saved to: ${outputFile}`);
}

generateTools();
