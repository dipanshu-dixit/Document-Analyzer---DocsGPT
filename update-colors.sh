#!/bin/bash

# Update color variable references in CSS file
sed -i 's/--color-bg/--bg-main/g' /home/dipanshu-dixit/Desktop/Projects/AI_DOCUMENT_ANALYSIS/frontend/styles/base.css
sed -i 's/--color-bg-secondary/--bg-secondary/g' /home/dipanshu-dixit/Desktop/Projects/AI_DOCUMENT_ANALYSIS/frontend/styles/base.css
sed -i 's/--color-border/--border/g' /home/dipanshu-dixit/Desktop/Projects/AI_DOCUMENT_ANALYSIS/frontend/styles/base.css
sed -i 's/--color-text/--text-primary/g' /home/dipanshu-dixit/Desktop/Projects/AI_DOCUMENT_ANALYSIS/frontend/styles/base.css
sed -i 's/--color-text-secondary/--text-secondary/g' /home/dipanshu-dixit/Desktop/Projects/AI_DOCUMENT_ANALYSIS/frontend/styles/base.css
sed -i 's/--color-text-muted/--text-muted/g' /home/dipanshu-dixit/Desktop/Projects/AI_DOCUMENT_ANALYSIS/frontend/styles/base.css