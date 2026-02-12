import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Components
import { AppHeader } from '../../app-header/app-header';
import { AppFooter } from '../../app-footer/app-footer';
import { LoadingSpinner } from '../../component/loading-spinner/loading-spinner';
import { GroupTable } from '../../component/group-table/group-table';

// Services and models
import { AuthService } from '../../core/service/auth-service';
import { AdminService } from '../../core/service/admin-service';
import { GroupService } from '../../core/service/group-service';
import { User } from '../../core/model/user';
import { UpdatePasswordModalModel } from '../../core/model/update-password-modal-model';
import { UserService } from '../../core/service/user-service';
import { UpdatePasswordRequest } from '../../core/model/update-password-request';
import { GroupBasicInfo } from '../../core/model/group_basic_info';
import { GroupCreateModel } from '../../core/model/group-create-model';
import { GroupDetails } from '../../core/model/group-details';
import { GroupUpdateModel } from '../../core/model/group-update-model';

@Component({
	selector: 'app-groups-page',
	imports: [],
	templateUrl: './groups-page.html',
	styleUrl: './groups-page.css',
})
export class GroupsPage {

}
