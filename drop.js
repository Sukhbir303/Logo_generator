function allowDrop(event) {
    event.preventDefault();
    event.stopPropagation();
}

function handleDrop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text/plain");
    const shapeType = event.dataTransfer.getData("shape-type");
    const draggedElement = document.getElementById(data);
    
    const dropZone = document.getElementById('dropZone');
    const rect = dropZone.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (shapeType) {
        const newShape = createShape(shapeType, x, y);
        newShape.style.transition = 'all 0.3s ease';
        newShape.style.opacity = '0';
        newShape.style.transform = 'scale(0.8)';
        
        addDeleteButton(newShape);
        dropZone.appendChild(newShape);
        
        setTimeout(() => {
            newShape.style.opacity = '1';
            newShape.style.transform = 'scale(1)';
        }, 50);
        
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        newShape.classList.add('selected');
        selectedElement = newShape;
    } else if (draggedElement) {
        if (!draggedElement.querySelector('.delete-btn')) {
            addDeleteButton(draggedElement);
        }
        
        draggedElement.style.transition = 'all 0.3s ease';
        draggedElement.style.position = 'absolute';
        draggedElement.style.left = `${x}px`;
        draggedElement.style.top = `${y}px`;
        draggedElement.style.zIndex = Date.now();
        dropZone.appendChild(draggedElement);
    }
}

function makeElementMoveable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    element.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target === element || e.target.parentElement === element) {
            isDragging = true;
            
            const rect = element.getBoundingClientRect();
            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;
            
            element.style.transition = 'none';
            element.style.cursor = 'grabbing';
            element.classList.add('dragging');
            element.style.zIndex = Date.now();
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            const dropZone = document.getElementById('dropZone');
            const dropRect = dropZone.getBoundingClientRect();
            
            currentX = e.clientX - dropRect.left - initialX;
            currentY = e.clientY - dropRect.top - initialY;

            // Constrain movement within dropZone boundaries
            const elementRect = element.getBoundingClientRect();
            currentX = Math.max(0, Math.min(currentX, dropRect.width - elementRect.width));
            currentY = Math.max(0, Math.min(currentY, dropRect.height - elementRect.height));

            element.style.left = `${currentX}px`;
            element.style.top = `${currentY}px`;
        }
    }

    function dragEnd() {
        if (isDragging) {
            isDragging = false;
            element.style.transition = 'all 0.3s ease';
            element.style.cursor = 'grab';
            element.classList.remove('dragging');
        }
    }
}

function handleDrag(event) {
    event.dataTransfer.setData("text/plain", event.target.id);
}

function dragStart(ev) {
    ev.target.style.opacity = '0.7';
    ev.dataTransfer.setData("text", ev.target.id);
    ev.dataTransfer.effectAllowed = "move";
}

// Add dragend event listener
document.addEventListener('dragend', function(e) {
    e.target.style.opacity = '1';
});

// Upload Image Functionality
document.getElementById('fileUpload').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const draggable = document.createElement('div');
            draggable.id = `uploaded-${Date.now()}`;
            draggable.className = 'image-box';
            draggable.style.backgroundImage = `url('${e.target.result}')`;
            draggable.draggable = true;
            draggable.ondragstart = handleDrag;
            
            // Add delete button
            addDeleteButton(draggable);
            
            const dropZone = document.getElementById('dropZone');
            dropZone.appendChild(draggable);
            
            // Center the uploaded image in the drop zone
            draggable.style.position = 'absolute';
            draggable.style.left = '50%';
            draggable.style.top = '50%';
            draggable.style.transform = 'translate(-50%, -50%)';
        };
        reader.readAsDataURL(file);
    }
});

function downloadOutput() {
    const dropZone = document.getElementById('dropZone');
    
    // Hide delete buttons temporarily
    const deleteButtons = dropZone.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => btn.style.display = 'none');

    // Ensure proper styling for the capture
    const draggables = dropZone.querySelectorAll('.draggable, .image-box, .shape-item');
    draggables.forEach(el => {
        el.style.outline = 'none';
        if (el.classList.contains('selected')) {
            el.classList.remove('selected');
        }
    });

    // First, ensure all images are loaded
    const loadImages = () => {
        const promises = [];
        
        // Get all elements with background images
        const elementsWithBg = dropZone.querySelectorAll('.image-box');
        elementsWithBg.forEach(el => {
            const style = window.getComputedStyle(el);
            const bgUrl = style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
            
            if (bgUrl) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                const promise = new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
                img.src = bgUrl[1];
                promises.push(promise);
            }
        });
        
        return Promise.all(promises);
    };

    // Wait for a moment to ensure all elements are rendered
    setTimeout(() => {
        // First, ensure all images are loaded
        loadImages().then(() => {
            html2canvas(dropZone, {
                backgroundColor: 'white',
                useCORS: true,
                allowTaint: true,
                foreignObjectRendering: true,
                scale: 2,
                logging: true,
                onclone: function(clonedDoc) {
                    const elements = clonedDoc.getElementsByClassName('image-box');
                    Array.from(elements).forEach(el => {
                        // Ensure background images are properly styled
                        el.style.backgroundRepeat = 'no-repeat';
                        el.style.backgroundPosition = 'center';
                        el.style.backgroundSize = 'cover';
                    });

                    // Ensure text elements are visible
                    const textElements = clonedDoc.getElementsByClassName('draggable');
                    Array.from(textElements).forEach(el => {
                        el.style.position = 'absolute';
                        el.style.zIndex = '1000';
                        el.style.color = 'black';
                    });
                }
            }).then(canvas => {
                try {
                    // Create a new canvas with white background
                    const finalCanvas = document.createElement('canvas');
                    const ctx = finalCanvas.getContext('2d');
                    finalCanvas.width = canvas.width;
                    finalCanvas.height = canvas.height;

                    // Fill white background
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

                    // Draw the original canvas content
                    ctx.drawImage(canvas, 0, 0);

                    // Convert to PNG and download
                    const imageData = finalCanvas.toDataURL('image/png', 1.0);
                    const link = document.createElement('a');
                    link.href = imageData;
                    link.download = 'logo-design.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Restore delete buttons
                    deleteButtons.forEach(btn => btn.style.display = '');

                    // Restore any selected states
                    draggables.forEach(el => {
                        if (el === selectedElement) {
                            el.classList.add('selected');
                        }
                    });

                } catch (error) {
                    console.error('Error in download process:', error);
                    alert('Error downloading image. Please check console for details.');
                }
            }).catch(error => {
                console.error('Error creating canvas:', error);
                alert('Error creating image. Please check console for details.');
            });
        });
    }, 100); // Small delay to ensure everything is rendered
}

document.querySelector('.add-slogan-btn').addEventListener('click', function() {
    const sloganText = document.getElementById('sloganInput').value;
    if (sloganText.trim() !== '') {
        const draggable = document.createElement('div');
        draggable.className = 'draggable';
        draggable.textContent = sloganText;
        draggable.style.position = 'absolute';
        draggable.style.cursor = 'move';
        draggable.style.fontFamily = document.getElementById('fontSelect').value;
        draggable.style.color = document.getElementById('textColorPicker').value;
        draggable.style.fontSize = document.getElementById('textSize').value + 'px';
        draggable.draggable = true;
        draggable.id = 'draggable-' + Date.now();
        
        // Add delete button
        addDeleteButton(draggable);
        
        const dropZone = document.getElementById('dropZone');
        draggable.style.left = '50%';
        draggable.style.top = '50%';
        draggable.style.transform = 'translate(-50%, -50%)';
        draggable.style.zIndex = '1000';
        
        // Make the text element moveable
        makeElementMoveable(draggable);
        
        dropZone.appendChild(draggable);
        document.getElementById('sloganInput').value = '';
    }
});

document.querySelectorAll('.shape').forEach(shape => {
    shape.setAttribute('draggable', true);
    shape.addEventListener('dragstart', function(e) {
        const shapeType = this.getAttribute('data-shape');
        const newShape = document.createElement('div');
        newShape.className = 'shape';
        newShape.setAttribute('data-shape', shapeType);
        newShape.id = 'shape-' + Date.now();
        newShape.style.position = 'absolute';
        e.dataTransfer.setData('text/plain', newShape.id);
        
        // Clone styles
        const styles = window.getComputedStyle(this);
        newShape.style.width = styles.width;
        newShape.style.height = styles.height;
        newShape.style.background = styles.background;
        newShape.style.clipPath = styles.clipPath;
        newShape.style.borderRadius = styles.borderRadius;
        
        // Temporarily add to document
        newShape.style.opacity = '0';
        document.body.appendChild(newShape);
        e.dataTransfer.setDragImage(newShape, 25, 25);
        
        // Clean up after drag starts
        setTimeout(() => {
            document.body.removeChild(newShape);
        }, 0);
    });
});

document.querySelectorAll('.shape-item').forEach(shape => {
    shape.addEventListener('dragstart', function(e) {
        const shapeType = this.getAttribute('data-shape');
        e.dataTransfer.setData('shape-type', shapeType); // Store shape type
    });
});

function changeSloganFont(fontFamily) {
    const dropZone = document.getElementById('dropZone');
    const slogans = dropZone.getElementsByClassName('draggable');
    
    Array.from(slogans).forEach(slogan => {
        slogan.style.fontFamily = fontFamily;
    });
}

// Track selected element
let selectedElement = null;

// Add click handler to make elements selectable
document.addEventListener('click', function(e) {
    // Remove previous selection
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    const clickedElement = e.target;
    
    // Check if clicked element is a shape, text, or image
    if (clickedElement.classList.contains('shape-item') || 
        clickedElement.classList.contains('draggable') || 
        clickedElement.classList.contains('image-box')) {
        
        clickedElement.classList.add('selected');
        selectedElement = clickedElement;
        
        // Update color pickers to match selected element's current colors
        if (clickedElement.classList.contains('draggable')) {
            const currentColor = window.getComputedStyle(clickedElement).color;
            document.getElementById('textColorPicker').value = rgbToHex(currentColor);
        } else if (clickedElement.classList.contains('shape-item') || 
                   clickedElement.classList.contains('image-box')) {
            const currentBgColor = window.getComputedStyle(clickedElement).backgroundColor;
            document.getElementById('shapeColorPicker').value = rgbToHex(currentBgColor);
        }
        
        // Update size slider for shapes
        if (clickedElement.classList.contains('shape-item')) {
            const shapeSize = parseInt(clickedElement.style.width) || 50;
            document.getElementById('shapeSize').value = shapeSize;
        }
    } else {
        selectedElement = null;
    }
});

// Update text color change event listener
document.getElementById('textColorPicker').addEventListener('input', function(e) {
    const dropZone = document.getElementById('dropZone');
    const textElements = dropZone.getElementsByClassName('draggable');
    
    // Apply color to all text elements in the drop zone
    Array.from(textElements).forEach(element => {
        element.style.color = e.target.value;
    });
});

// Update the color change event listeners
document.getElementById('shapeColorPicker').addEventListener('input', function(e) {
    if (selectedElement) {
        if (selectedElement.classList.contains('shape-item')) {
            // For shape elements
            selectedElement.style.backgroundColor = e.target.value;
        } else if (selectedElement.classList.contains('image-box')) {
            // For image boxes
            selectedElement.style.backgroundColor = e.target.value;
            selectedElement.style.backgroundImage = 'none';
        }
    }
});

// Add styles for selected elements
const style = document.createElement('style');
style.textContent = `
    .selected {
        outline: 2px solid #0071FF !important;
        outline-offset: 2px;
    }
`;
document.head.appendChild(style);

// Add size control functionality
document.getElementById('shapeSize').addEventListener('input', function(e) {
    if (selectedElement && selectedElement.classList.contains('shape-item')) {
        const size = e.target.value;
        if (selectedElement.getAttribute('data-shape') === 'rectangle') {
            selectedElement.style.width = `${size * 1.4}px`;
            selectedElement.style.height = `${size * 0.8}px`;
        } else {
            selectedElement.style.width = `${size}px`;
            selectedElement.style.height = `${size}px`;
        }
    }
});

// Helper function to convert RGB to Hex color
function rgbToHex(rgb) {
    // If already hex, return as is
    if (rgb.startsWith('#')) return rgb;
    
    // Extract RGB values
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#000000';
    
    const r = parseInt(rgbValues[0]);
    const g = parseInt(rgbValues[1]);
    const b = parseInt(rgbValues[2]);
    
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Update shape creation to include color
function createShape(shapeType, x, y) {
    const newShape = document.createElement('div');
    newShape.className = 'shape-item';
    newShape.setAttribute('data-shape', shapeType);
    newShape.id = `shape-${Date.now()}`;
    newShape.draggable = true;
    
    newShape.style.position = 'absolute';
    newShape.style.left = `${x}px`;
    newShape.style.top = `${y}px`;
    newShape.style.backgroundColor = document.getElementById('shapeColorPicker').value;
    
    // Add delete button
    addDeleteButton(newShape);
    
    makeElementMoveable(newShape);
    return newShape;
}

// Add this JavaScript for sidebar toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const body = document.body;
    
    // Initialize sidebar state
    let isVisible = false;

    sidebarToggle.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event bubbling
        isVisible = !isVisible;
        
        if (isVisible) {
            sidebar.style.visibility = 'visible';
            sidebar.style.opacity = '1';
            sidebar.classList.add('visible');
            body.classList.add('sidebar-visible');
        } else {
            sidebar.classList.remove('visible');
            body.classList.remove('sidebar-visible');
            // Delay hiding the sidebar until transition completes
            setTimeout(() => {
                if (!isVisible) {
                    sidebar.style.visibility = 'hidden';
                    sidebar.style.opacity = '0';
                }
            }, 300); // Match transition duration
        }
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        if (isVisible && 
            !sidebar.contains(e.target) && 
            e.target !== sidebarToggle) {
            isVisible = false;
            sidebar.classList.remove('visible');
            body.classList.remove('sidebar-visible');
            setTimeout(() => {
                if (!isVisible) {
                    sidebar.style.visibility = 'hidden';
                    sidebar.style.opacity = '0';
                }
            }, 300);
        }
    });

    // Prevent clicks inside sidebar from closing it
    sidebar.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});

// Add these event listeners for size controls
document.addEventListener('DOMContentLoaded', function() {
    const textSizeSlider = document.getElementById('textSize');
    const imageSizeSlider = document.getElementById('imageSize');
    const textSizeValue = document.getElementById('textSizeValue');
    const imageSizeValue = document.getElementById('imageSizeValue');

    // Text size control
    textSizeSlider.addEventListener('input', function(e) {
        const size = e.target.value;
        textSizeValue.textContent = size + 'px';
        
        if (selectedElement && selectedElement.classList.contains('draggable')) {
            selectedElement.style.fontSize = size + 'px';
        }
    });

    // Image size control
    imageSizeSlider.addEventListener('input', function(e) {
        const size = e.target.value;
        imageSizeValue.textContent = size + 'px';
        
        if (selectedElement && selectedElement.classList.contains('image-box')) {
            selectedElement.style.width = size + 'px';
            selectedElement.style.height = size + 'px';
        }
    });

    // Update size controls when selecting elements
    document.addEventListener('click', function(e) {
        const clickedElement = e.target;
        
        if (clickedElement.classList.contains('draggable')) {
            // Update text size slider for text elements
            const currentSize = parseInt(window.getComputedStyle(clickedElement).fontSize);
            textSizeSlider.value = currentSize;
            textSizeValue.textContent = currentSize + 'px';
        } else if (clickedElement.classList.contains('image-box')) {
            // Update image size slider for images
            const currentSize = parseInt(window.getComputedStyle(clickedElement).width);
            imageSizeSlider.value = currentSize;
            imageSizeValue.textContent = currentSize + 'px';
        }
    });

    // Update new text elements to use current size
    document.querySelector('.add-slogan-btn').addEventListener('click', function() {
        const sloganText = document.getElementById('sloganInput').value;
        if (sloganText.trim() !== '') {
            const currentTextSize = textSizeSlider.value;
            const draggable = document.createElement('div');
            // ... existing slogan creation code ...
            draggable.style.fontSize = currentTextSize + 'px';
            // ... rest of the code ...
        }
    });

    // Update new images to use current size
    document.getElementById('fileUpload').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const currentImageSize = imageSizeSlider.value;
            // ... existing image upload code ...
            draggable.style.width = currentImageSize + 'px';
            draggable.style.height = currentImageSize + 'px';
            // ... rest of the code ...
        }
    });
});

// Add drag over effect to dropzone
const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', function(e) {
    this.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', function(e) {
    this.classList.remove('drag-over');
});

dropZone.addEventListener('drop', function(e) {
    this.classList.remove('drag-over');
});

// Function to add delete button to elements
function addDeleteButton(element) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering other click events
        element.style.transition = 'all 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        
        // Remove element after animation
        setTimeout(() => {
            element.remove();
        }, 300);
    });
    element.appendChild(deleteBtn);
}

// Add keyboard delete support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedElement = document.querySelector('.selected');
        if (selectedElement) {
            // Add fade-out animation
            selectedElement.style.transition = 'all 0.3s ease';
            selectedElement.style.opacity = '0';
            selectedElement.style.transform = 'scale(0.8)';
            
            // Remove element after animation
            setTimeout(() => {
                selectedElement.remove();
            }, 300);
        }
    }
});

function rotateShape(degrees) {
    const selectedElement = document.querySelector('.selected');
    if (selectedElement) {
        const currentTransform = window.getComputedStyle(selectedElement).transform;
        const matrix = new DOMMatrix(currentTransform);
        const angle = Math.atan2(matrix.e, matrix.f);
        const newAngle = angle + (degrees * Math.PI / 180);
        const newTransform = `rotate(${degrees}deg)`;
        selectedElement.style.transform = newTransform;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const rotationSlider = document.getElementById('rotationSlider');
    const rotationValue = document.getElementById('rotationValue');
    const rotateLeft = document.getElementById('rotateLeft');
    const rotateRight = document.getElementById('rotateRight');
    const resetRotation = document.getElementById('resetRotation');

    let selectedElement = null;

    // Update the click handler to track selected elements
    document.addEventListener('click', function(e) {
        const clickedElement = e.target;
        
        // Remove previous selection
        document.querySelectorAll('.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Check if clicked element is rotatable
        if (clickedElement.classList.contains('draggable') || 
            clickedElement.classList.contains('image-box') || 
            clickedElement.classList.contains('shape-item')) {
            
            clickedElement.classList.add('selected');
            selectedElement = clickedElement;
            
            // Update rotation slider to match current rotation
            const currentRotation = getCurrentRotation(selectedElement);
            rotationSlider.value = currentRotation;
            rotationValue.textContent = `${currentRotation}°`;
        } else {
            selectedElement = null;
        }
    });

    // Rotation slider handler
    rotationSlider.addEventListener('input', function(e) {
        if (selectedElement) {
            const angle = e.target.value;
            rotationValue.textContent = `${angle}°`;
            selectedElement.style.transform = `rotate(${angle}deg)`;
        }
    });

    // Rotate left button (-90 degrees)
    rotateLeft.addEventListener('click', function() {
        if (selectedElement) {
            const currentRotation = getCurrentRotation(selectedElement);
            const newRotation = currentRotation - 90;
            updateRotation(newRotation);
        }
    });

    // Rotate right button (+90 degrees)
    rotateRight.addEventListener('click', function() {
        if (selectedElement) {
            const currentRotation = getCurrentRotation(selectedElement);
            const newRotation = currentRotation + 90;
            updateRotation(newRotation);
        }
    });

    // Reset rotation button
    resetRotation.addEventListener('click', function() {
        if (selectedElement) {
            updateRotation(0);
        }
    });

    // Helper function to get current rotation
    function getCurrentRotation(element) {
        const transform = window.getComputedStyle(element).transform;
        if (transform === 'none') return 0;
        
        const values = transform.split('(')[1].split(')')[0].split(',');
        const a = values[0];
        const b = values[1];
        const angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
        return angle < 0 ? angle + 360 : angle;
    }

    // Helper function to update rotation
    function updateRotation(angle) {
        if (!selectedElement) return;
        
        // Normalize angle to 0-360
        angle = angle % 360;
        if (angle < 0) angle += 360;
        
        // Update slider and display
        rotationSlider.value = angle;
        rotationValue.textContent = `${angle}°`;
        
        // Apply rotation
        selectedElement.style.transform = `rotate(${angle}deg)`;
    }

    // Add keyboard shortcuts for rotation
    document.addEventListener('keydown', function(e) {
        if (!selectedElement) return;
        
        const currentRotation = getCurrentRotation(selectedElement);
        
        switch(e.key) {
            case 'ArrowLeft':
                if (e.shiftKey) {
                    updateRotation(currentRotation - 90);
                } else {
                    updateRotation(currentRotation - 1);
                }
                e.preventDefault();
                break;
            case 'ArrowRight':
                if (e.shiftKey) {
                    updateRotation(currentRotation + 90);
                } else {
                    updateRotation(currentRotation + 1);
                }
                e.preventDefault();
                break;
            case 'r':
                updateRotation(0);
                e.preventDefault();
                break;
        }
    });
});
/* Update your existing text creation code */
function createDraggableText(text, x, y) {
    const textElement = document.createElement('div');
    textElement.className = 'draggable-text';
    textElement.innerHTML = text;
    textElement.style.position = 'absolute';
    textElement.style.left = x + 'px';
    textElement.style.top = y + 'px';
    textElement.style.cursor = 'move';
    textElement.style.userSelect = 'none';
    
    // Add text styling controls
    const textControls = document.createElement('div');
    textControls.className = 'text-controls';
    textControls.innerHTML = `
        <div class="text-handle">⋮</div>
        <div class="text-options">
            <button class="font-size-up">A+</button>
            <button class="font-size-down">A-</button>
            <input type="color" class="text-color" value="#000000">
            <select class="font-family">
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Verdana">Verdana</option>
                <option value="Courier New">Courier New</option>
            </select>
        </div>
    `;

    textElement.appendChild(textControls);

    // Make text editable on double click
    textElement.addEventListener('dblclick', function(e) {
        if (e.target === textElement) {
            textElement.contentEditable = true;
            textElement.focus();
        }
    });

    // Disable contentEditable on blur
    textElement.addEventListener('blur', function() {
        textElement.contentEditable = false;
    });

    // Add drag functionality
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    textElement.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target.closest('.text-controls')) return;
        
        initialX = e.clientX - textElement.offsetLeft;
        initialY = e.clientY - textElement.offsetTop;
        
        if (e.target === textElement) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            // Get dropbox boundaries
            const dropbox = document.querySelector('.dropbox');
            const dropboxRect = dropbox.getBoundingClientRect();
            const textRect = textElement.getBoundingClientRect();

            // Constrain movement within dropbox
            currentX = Math.max(0, Math.min(currentX, dropboxRect.width - textRect.width));
            currentY = Math.max(0, Math.min(currentY, dropboxRect.height - textRect.height));

            textElement.style.left = currentX + 'px';
            textElement.style.top = currentY + 'px';
        }
    }

    function dragEnd() {
        isDragging = false;
    }

    // Add text styling functionality
    const fontSizeUp = textControls.querySelector('.font-size-up');
    const fontSizeDown = textControls.querySelector('.font-size-down');
    const colorPicker = textControls.querySelector('.text-color');
    const fontSelect = textControls.querySelector('.font-family');

    fontSizeUp.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentSize = parseInt(window.getComputedStyle(textElement).fontSize);
        textElement.style.fontSize = (currentSize + 2) + 'px';
    });

    fontSizeDown.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentSize = parseInt(window.getComputedStyle(textElement).fontSize);
        textElement.style.fontSize = Math.max(8, currentSize - 2) + 'px';
    });

    colorPicker.addEventListener('input', (e) => {
        e.stopPropagation();
        textElement.style.color = e.target.value;
    });

    fontSelect.addEventListener('change', (e) => {
        e.stopPropagation();
        textElement.style.fontFamily = e.target.value;
    });

    return textElement;
}