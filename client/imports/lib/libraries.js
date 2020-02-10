import 'bootstrap/dist/css/bootstrap.css';
import  { dom, library } from '@fortawesome/fontawesome-svg-core';
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { faArrowsAlt } from '@fortawesome/free-solid-svg-icons/faArrowsAlt';

import 'jquery/dist/jquery';
import 'bootstrap/dist/js/bootstrap';

library.add([faBars, faTimes, faArrowsAlt]);
dom.watch();
