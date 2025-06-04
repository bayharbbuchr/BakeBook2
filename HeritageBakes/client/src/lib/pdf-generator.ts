import type { Recipe } from "@shared/schema";

export async function generatePDF(recipes: Recipe[], title: string = "My Recipe Collection") {
  // Import jsPDF dynamically to avoid SSR issues
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  let yPosition = margin;

  // Color scheme - Floral theme
  const colors = {
    primary: [174, 90, 174], // Purple
    accent: [224, 102, 160], // Pink
    text: [64, 64, 64], // Dark gray
    lightText: [128, 128, 128], // Light gray
    background: [252, 249, 252] // Very light pink
  };

  // Helper function to add a new page with decorative elements
  const addNewPage = () => {
    doc.addPage();
    yPosition = margin;
    addPageDecorations();
  };

  // Helper function to add decorative elements to each page
  const addPageDecorations = () => {
    // Subtle border decoration
    doc.setLineWidth(0.5);
    doc.setDrawColor(...colors.accent);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);
    
    // Corner flourishes (simple geometric shapes)
    doc.setFillColor(...colors.accent);
    doc.circle(25, 25, 3, 'F');
    doc.circle(pageWidth - 25, 25, 3, 'F');
    doc.circle(25, pageHeight - 25, 3, 'F');
    doc.circle(pageWidth - 25, pageHeight - 25, 3, 'F');
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin - 20) {
      addNewPage();
    }
  };

  // Cover Page
  addPageDecorations();
  
  // Main title with elegant styling
  doc.setFontSize(32);
  doc.setTextColor(...colors.primary);
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 80);

  // Decorative line under title
  doc.setLineWidth(1);
  doc.setDrawColor(...colors.accent);
  doc.line((pageWidth - titleWidth) / 2, 85, (pageWidth + titleWidth) / 2, 85);

  // Subtitle
  doc.setFontSize(14);
  doc.setTextColor(...colors.text);
  const subtitle = `A Collection of ${recipes.length} Cherished Family Recipes`;
  const subtitleWidth = doc.getTextWidth(subtitle);
  doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 105);

  // Date
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.setFontSize(12);
  doc.setTextColor(...colors.lightText);
  const dateWidth = doc.getTextWidth(today);
  doc.text(today, (pageWidth - dateWidth) / 2, 120);

  // Decorative recipe icon (using simple shapes)
  doc.setFillColor(...colors.accent);
  // Create a simple book icon using rectangles
  doc.rect(pageWidth / 2 - 15, 140, 30, 35, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(pageWidth / 2 - 12, 143, 6, 29, 'F');
  doc.rect(pageWidth / 2 - 3, 143, 6, 29, 'F');
  doc.rect(pageWidth / 2 + 6, 143, 6, 29, 'F');

  addNewPage();

  // Table of Contents
  doc.setFontSize(24);
  doc.setTextColor(...colors.primary);
  doc.text('Table of Contents', margin, yPosition);
  yPosition += 15;

  // Decorative line under TOC title
  doc.setLineWidth(0.5);
  doc.setDrawColor(...colors.accent);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setTextColor(...colors.text);
  recipes.forEach((recipe, index) => {
    checkPageBreak(15);
    
    // Recipe title with dot leaders
    const maxTitleWidth = pageWidth - margin - 50;
    let recipeTitle = recipe.title;
    if (doc.getTextWidth(recipeTitle) > maxTitleWidth) {
      while (doc.getTextWidth(recipeTitle + '...') > maxTitleWidth && recipeTitle.length > 0) {
        recipeTitle = recipeTitle.slice(0, -1);
      }
      recipeTitle += '...';
    }
    
    doc.text(recipeTitle, margin, yPosition);
    
    // Page number
    const pageNum = `${index + 3}`;
    const pageNumWidth = doc.getTextWidth(pageNum);
    doc.text(pageNum, pageWidth - margin - pageNumWidth, yPosition);
    
    // Dot leaders
    const titleWidth = doc.getTextWidth(recipeTitle);
    const startX = margin + titleWidth + 5;
    const endX = pageWidth - margin - pageNumWidth - 5;
    const dotSpacing = 4;
    
    doc.setTextColor(...colors.lightText);
    for (let x = startX; x < endX; x += dotSpacing) {
      doc.text('.', x, yPosition);
    }
    doc.setTextColor(...colors.text);
    
    yPosition += 14;
  });

  // Recipe Pages
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    addNewPage();

    // Recipe Title with elegant styling
    doc.setFontSize(22);
    doc.setTextColor(174, 90, 174); // Primary purple
    const recipeTitleWidth = doc.getTextWidth(recipe.title);
    doc.text(recipe.title, (pageWidth - recipeTitleWidth) / 2, yPosition);
    yPosition += 8;

    // Decorative line under recipe title
    doc.setLineWidth(0.5);
    doc.setDrawColor(224, 102, 160); // Accent pink
    doc.line((pageWidth - recipeTitleWidth) / 2, yPosition, (pageWidth + recipeTitleWidth) / 2, yPosition);
    yPosition += 15;

    // Cook Time with icon-like styling
    if (recipe.cookTime) {
      doc.setFontSize(12);
      doc.setTextColor(128, 128, 128); // Light gray
      const cookTimeText = `⏱ Cooking Time: ${recipe.cookTime}`;
      const cookTimeWidth = doc.getTextWidth(cookTimeText);
      doc.text(cookTimeText, (pageWidth - cookTimeWidth) / 2, yPosition);
      yPosition += 20;
    }

    // Memory section with elegant styling
    if (recipe.memory) {
      checkPageBreak(50);
      
      // Memory box with background
      const memoryBoxHeight = 40;
      doc.setFillColor(252, 249, 252); // Very light pink background
      doc.setDrawColor(224, 102, 160); // Pink border
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, memoryBoxHeight, 'FD');
      
      doc.setFontSize(14);
      doc.setTextColor(174, 90, 174); // Primary purple
      doc.text('♥ A Special Memory', margin + 10, yPosition + 8);
      
      doc.setFontSize(11);
      doc.setTextColor(64, 64, 64); // Dark gray
      const memoryLines = doc.splitTextToSize(`"${recipe.memory}"`, pageWidth - 2 * margin - 20);
      doc.text(memoryLines, margin + 10, yPosition + 18);
      yPosition += memoryBoxHeight + 15;
    }

    // Ingredients section
    checkPageBreak(60);
    doc.setFontSize(16);
    doc.setTextColor(174, 90, 174); // Primary purple
    doc.text('Ingredients', margin, yPosition);
    yPosition += 5;
    
    // Underline for ingredients
    doc.setLineWidth(0.3);
    doc.setDrawColor(224, 102, 160);
    doc.line(margin, yPosition, margin + 60, yPosition);
    yPosition += 12;

    doc.setFontSize(11);
    doc.setTextColor(64, 64, 64);
    recipe.ingredients.forEach((ingredient) => {
      checkPageBreak(10);
      doc.text(`• ${ingredient}`, margin + 8, yPosition);
      yPosition += 10;
    });

    yPosition += 15;

    // Directions section
    checkPageBreak(60);
    doc.setFontSize(16);
    doc.setTextColor(174, 90, 174); // Primary purple
    doc.text('Directions', margin, yPosition);
    yPosition += 5;
    
    // Underline for directions
    doc.setLineWidth(0.3);
    doc.setDrawColor(224, 102, 160);
    doc.line(margin, yPosition, margin + 60, yPosition);
    yPosition += 12;

    doc.setFontSize(11);
    doc.setTextColor(64, 64, 64);
    
    // Split directions into numbered steps if they contain line breaks
    const directionSteps = recipe.directions.split('\n').filter(step => step.trim());
    if (directionSteps.length > 1) {
      directionSteps.forEach((step, stepIndex) => {
        checkPageBreak(15);
        const stepText = `${stepIndex + 1}. ${step.trim()}`;
        const stepLines = doc.splitTextToSize(stepText, pageWidth - 2 * margin - 15);
        stepLines.forEach((line: string, lineIndex: number) => {
          checkPageBreak(8);
          doc.text(line, margin + (lineIndex === 0 ? 8 : 20), yPosition);
          yPosition += 8;
        });
        yPosition += 4;
      });
    } else {
      const directionLines = doc.splitTextToSize(recipe.directions, pageWidth - 2 * margin - 10);
      directionLines.forEach((line: string) => {
        checkPageBreak(8);
        doc.text(line, margin + 8, yPosition);
        yPosition += 8;
      });
    }

    // Tags section
    if (recipe.tags && recipe.tags.length > 0) {
      yPosition += 15;
      checkPageBreak(20);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Categories: ${recipe.tags.join(' • ')}`, margin, yPosition);
    }

    // Page number with elegant styling
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    const pageText = `${i + 3}`;
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, (pageWidth - pageTextWidth) / 2, pageHeight - 15);
    
    // Small decorative elements around page number
    doc.setFillColor(224, 102, 160);
    doc.circle((pageWidth - pageTextWidth) / 2 - 8, pageHeight - 17, 1, 'F');
    doc.circle((pageWidth + pageTextWidth) / 2 + 8, pageHeight - 17, 1, 'F');
  }

  // Save the PDF
  doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
}
