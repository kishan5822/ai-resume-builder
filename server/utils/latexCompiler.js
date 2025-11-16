const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Check if Tectonic is installed and accessible
 */
async function checkTectonicInstallation() {
  try {
    const { stdout } = await execPromise('tectonic --version');
    return {
      installed: true,
      version: stdout.trim(),
      message: 'Tectonic is installed and ready'
    };
  } catch (error) {
    return {
      installed: false,
      version: null,
      message: 'Tectonic is not installed or not in PATH',
      error: error.message
    };
  }
}

/**
 * Compile LaTeX to PDF using Tectonic
 */
async function compileLaTeX(texFilePath, outputDir) {
  try {
    console.log('🔧 Compiling with Tectonic...');
    
    const command = process.platform === 'win32'
      ? `tectonic.exe "${texFilePath}" --outdir "${outputDir}"`
      : `tectonic "${texFilePath}" --outdir "${outputDir}"`;
    
    console.log('🔧 Executing command:', command);
    
    const { stdout, stderr } = await execPromise(command, {
      timeout: 60000, // 60 second timeout
      shell: true,
      windowsHide: true
    });

    console.log('✅ Tectonic compilation successful!');
    if (stdout) console.log('📄 Tectonic stdout:', stdout);
    if (stderr) console.log('⚠️ Tectonic stderr:', stderr);

    return {
      success: true,
      output: stdout,
      error: stderr || null
    };
  } catch (error) {
    console.error('❌ Tectonic compilation failed:', error.message);
    
    return {
      success: false,
      output: null,
      error: error.message || 'LaTeX compilation failed',
      details: error.stderr || error.stdout || 'Compilation error'
    };
  }
}

module.exports = {
  checkTectonicInstallation,
  compileLaTeX
};
