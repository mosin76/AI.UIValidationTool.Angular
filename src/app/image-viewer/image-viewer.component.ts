import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-image-viewer',
    standalone: true,
    templateUrl: './image-viewer.component.html',
    styleUrls: ['./image-viewer.component.css']
    //imports: [NgbModal],
})
export class ImageViewerComponent implements OnInit {
    @Input() imageUrl: string = 'https://via.placeholder.com/300';
    @Input() title: string = '';
    @Input() imageLoadFailed: (event: Event) => void = () => { };

    constructor(private modalService: NgbModal) {
        console.trace('ImageViewerComponent');
    }

    ngOnInit() {
		console.trace('ImageViewerComponent ngOnInit');
	}

    open(content: any) {
        this.modalService.open(content, { fullscreen: true });
    }
}