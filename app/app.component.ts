import { Component, OnInit, HostListener, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { LayoutService } from '@volo/ngx-lepton-x.core';

@Component({
    selector: 'app-root',
    template: `
    <abp-loader-bar></abp-loader-bar>
    <abp-dynamic-layout></abp-dynamic-layout>
    <abp-internet-status></abp-internet-status>
    
  `,
})
export class AppComponent implements OnInit {
    protected layoutService = inject(LayoutService);

    private previousWidth: number = window.innerWidth;

    constructor(private router: Router) { }

    ngOnInit(): void {
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.checkWindowSize(); // Check window size on each navigation
            }
        });
    }

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        this.checkWindowSize(); // Check window size on resize
    }

    private checkWindowSize(): void {
        const currentWidth = window.innerWidth;

        if (
            (this.previousWidth >= 768 && currentWidth < 768) ||
            (this.previousWidth < 768 && currentWidth >= 768)
        ) {
            window.location.reload(); // Reload the page if width crosses 768px
        }

        this.previousWidth = currentWidth; // Update the previous width
    }
}


