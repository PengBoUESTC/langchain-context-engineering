/**
 * Tools - Agent 工具系统
 * 实现动态上下文检索和其他工具功能
 * 遵循 Context Engineering 原则：工具应该清晰、高效、token 友好
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import * as fs from 'fs';
import * as path from 'path';

/**
 * 匹配文件名模式（简单实现）
 */
function matchesPattern(filename: string, pattern: string): boolean {
  const regex_pattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
  const regex = new RegExp(`^${regex_pattern}$`, 'i');
  return regex.test(filename);
}

/**
 * 检查是否为文本文件
 */
function isTextFile(filename: string): boolean {
  const text_extensions = [
    '.txt', '.md', '.js', '.ts', '.jsx', '.tsx',
    '.json', '.xml', '.html', '.css', '.vue',
    '.py', '.java', '.cpp', '.c', '.go', '.rs',
    '.php', '.rb', '.swift', '.kt', '.sql',
  ];
  const ext = path.extname(filename).toLowerCase();
  return text_extensions.includes(ext) || !ext;
}

/**
 * 文件读取工具
 * 支持按需检索文件内容（just-in-time retrieval）
 */
export const fileReadTool = new DynamicStructuredTool({
  name: "read_file",
  description: "读取文件内容。使用此工具来获取代码文件或其他文档的内容。",
  schema: z.object({
    file_path: z.string().describe("要读取的文件路径"),
  }),
  func: async ({ file_path }) => {
    try {
      const content = fs.readFileSync(file_path, 'utf-8');
      return JSON.stringify({
        success: true,
        content,
        file_path,
        size: content.length,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
        file_path,
      });
    }
  },
});

/**
 * 文件搜索工具
 * 在目录中搜索文件
 */
export const fileSearchTool = new DynamicStructuredTool({
  name: "search_files",
  description: "在指定目录中搜索文件。支持文件名模式匹配。",
  schema: z.object({
    directory: z.string().describe("要搜索的目录路径"),
    pattern: z.string().optional().describe("文件名模式（可选，支持通配符）"),
  }),
  func: async ({ directory, pattern }) => {
    try {
      const files: string[] = [];
      
      const searchDirectory = (dir: string) => {
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const full_path = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
              if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                searchDirectory(full_path);
              }
            } else if (entry.isFile()) {
              if (!pattern || matchesPattern(entry.name, pattern)) {
                files.push(full_path);
              }
            }
          }
        } catch (error) {
          // 忽略无法访问的目录
        }
      };

      searchDirectory(directory);
      
      return JSON.stringify({
        success: true,
        files: files.slice(0, 50),
        count: files.length,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

/**
 * 代码搜索工具（grep-like）
 * 在文件中搜索文本模式
 */
export const codeSearchTool = new DynamicStructuredTool({
  name: "grep_code",
  description: "在文件中搜索文本模式。类似于 grep 命令。",
  schema: z.object({
    pattern: z.string().describe("要搜索的文本模式或正则表达式"),
    file_path: z.string().optional().describe("要搜索的文件路径（可选，不指定则搜索目录）"),
    directory: z.string().optional().describe("要搜索的目录路径（可选）"),
  }),
  func: async ({ pattern, file_path, directory }) => {
    try {
      const results: Array<{ file: string; line: number; content: string }> = [];
      const regex = new RegExp(pattern, 'i');

      if (file_path) {
        // 搜索单个文件
        const content = fs.readFileSync(file_path, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (regex.test(line)) {
            results.push({
              file: file_path,
              line: index + 1,
              content: line.trim(),
            });
          }
        });
      } else if (directory) {
        // 搜索目录中的文件
        const searchDirectory = (dir: string) => {
          try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
              const full_path = path.join(dir, entry.name);
              
              if (entry.isDirectory()) {
                if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                  searchDirectory(full_path);
                }
              } else if (entry.isFile() && isTextFile(entry.name)) {
                try {
                  const content = fs.readFileSync(full_path, 'utf-8');
                  const lines = content.split('\n');
                  
                  lines.forEach((line, index) => {
                    if (regex.test(line)) {
                      results.push({
                        file: full_path,
                        line: index + 1,
                        content: line.trim(),
                      });
                    }
                  });
                } catch (error) {
                  // 忽略无法读取的文件
                }
              }
            }
          } catch (error) {
            // 忽略无法访问的目录
          }
        };

        searchDirectory(directory);
      }

      return JSON.stringify({
        success: true,
        results: results.slice(0, 100),
        count: results.length,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

/**
 * 获取所有可用工具
 */
export function getTools() {
  return [
    fileReadTool,
    fileSearchTool,
    codeSearchTool,
  ];
}
